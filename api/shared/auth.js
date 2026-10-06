// Secure Authentication & Session Token Module for LIT MSA Challenge
const crypto = require('crypto')

function getAdminSecret() {
  return process.env.ADMIN_PASSWORD || process.env.AZURE_ADMIN_PASSWORD || ''
}

function getJwtSecret() {
  return process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || 'lit_msa_session_sign_key'
}

function hashPassword(pw) {
  return crypto.createHash('sha256').update(String(pw || '').trim()).digest('hex')
}

function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4) {
    base64 += '='
  }
  return Buffer.from(base64, 'base64').toString('utf8')
}

/**
 * Creates an HMAC-SHA256 signed session token
 * @param {string} handle 
 * @param {boolean} isAdmin 
 * @param {number} expiresInSeconds (default 7 days)
 */
function createSessionToken(handle, isAdmin = false, expiresInSeconds = 7 * 24 * 3600) {
  const payload = {
    handle: String(handle || '').trim().toLowerCase(),
    isAdmin: !!isAdmin,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  }
  const payloadEncoded = base64UrlEncode(JSON.stringify(payload))
  const signature = crypto
    .createHmac('sha256', getJwtSecret())
    .update(payloadEncoded)
    .digest('hex')

  return `${payloadEncoded}.${signature}`
}

function sendJson(context, status, body) {
  context.res = {
    status,
    headers: {
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff',
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  }
}

const memRateLimit = new Map()

/**
 * Distributed rate limiter protecting against brute-force attacks across serverless instances
 */
async function checkRateLimit(clientId, maxAttempts = 5, windowMs = 5 * 60 * 1000, container = null) {
  const now = Date.now()
  // 1. In-memory check
  const mem = memRateLimit.get(clientId)
  if (mem) {
    if (now > mem.resetAt) {
      memRateLimit.delete(clientId)
    } else if (mem.count >= maxAttempts) {
      return { blocked: true, remainSec: Math.ceil((mem.resetAt - now) / 1000) }
    }
  }

  // 2. Cosmos DB cross-instance persistent check
  if (container) {
    try {
      const docId = `rl_${crypto.createHash('md5').update(String(clientId)).digest('hex')}`
      const itemRes = await container.item(docId, '__rate_limit').read().catch(() => null)
      const doc = itemRes?.resource
      if (doc && doc.resetAt > now) {
        if (doc.count >= maxAttempts) {
          memRateLimit.set(clientId, { count: doc.count, resetAt: doc.resetAt })
          return { blocked: true, remainSec: Math.ceil((doc.resetAt - now) / 1000) }
        }
      }
    } catch (_) {}
  }

  return { blocked: false }
}

async function recordFailedAttempt(clientId, windowMs = 5 * 60 * 1000, container = null) {
  const now = Date.now()
  let count = 1
  let resetAt = now + windowMs

  const mem = memRateLimit.get(clientId)
  if (mem && now <= mem.resetAt) {
    count = mem.count + 1
    resetAt = mem.resetAt
  }
  memRateLimit.set(clientId, { count, resetAt })

  if (container) {
    try {
      const docId = `rl_${crypto.createHash('md5').update(String(clientId)).digest('hex')}`
      await container.items.upsert({
        id: docId,
        handle: '__rate_limit',
        type: 'rate_limit',
        clientId: String(clientId),
        count,
        resetAt,
        updatedAt: new Date().toISOString(),
      }).catch(() => {})
    } catch (_) {}
  }
}

async function clearFailedAttempt(clientId, container = null) {
  memRateLimit.delete(clientId)
  if (container) {
    try {
      const docId = `rl_${crypto.createHash('md5').update(String(clientId)).digest('hex')}`
      await container.item(docId, '__rate_limit').delete().catch(() => {})
    } catch (_) {}
  }
}

/**
 * Verifies the caller's session token from request headers
 * Supports:
 * - x-lit-auth-token: <token>
 * - Authorization: Bearer <token>
 * - x-access-token: <token>
 * - query param ?token=<token>
 * - x-admin-key: <ADMIN_PASSWORD> (Direct administrative access)
 * 
 * @param {object} req 
 * @returns {{ valid: boolean, handle: string, isAdmin: boolean, reason?: string }}
 */
function verifyAuth(req) {
  if (!req) {
    return { valid: false, handle: '', isAdmin: false, reason: 'No request provided' }
  }

  const headers = req.headers || {}

  // 1. Direct Admin Key Check (Header: x-admin-key or query: adminKey)
  const adminKey = headers['x-admin-key'] || (req.query && req.query.adminKey)
  if (adminKey && String(adminKey).trim() === getAdminSecret()) {
    return { valid: true, handle: 'lit', isAdmin: true, reason: 'admin_key_authenticated' }
  }

  // 2. Token Extraction
  let token = headers['x-lit-auth-token'] || headers['x-access-token'] || (req.query && req.query.token)
  const authHeader = headers['authorization'] || headers['Authorization']
  if (!token && authHeader && typeof authHeader === 'string') {
    const parts = authHeader.split(' ')
    if (parts.length === 2 && /^bearer$/i.test(parts[0])) {
      token = parts[1]
    }
  }

  if (!token || typeof token !== 'string') {
    return { valid: false, handle: '', isAdmin: false, reason: 'No auth token found' }
  }

  const dotIdx = token.indexOf('.')
  if (dotIdx === -1) {
    return { valid: false, handle: '', isAdmin: false, reason: 'Malformed token structure' }
  }

  const payloadEncoded = token.substring(0, dotIdx)
  const providedSignature = token.substring(dotIdx + 1)

  const expectedSignature = crypto
    .createHmac('sha256', getJwtSecret())
    .update(payloadEncoded)
    .digest('hex')

  // Constant-time signature comparison to prevent timing attacks
  const bufProvided = Buffer.from(providedSignature)
  const bufExpected = Buffer.from(expectedSignature)
  if (bufProvided.length !== bufExpected.length || !crypto.timingSafeEqual(bufProvided, bufExpected)) {
    return { valid: false, handle: '', isAdmin: false, reason: 'Invalid token signature' }
  }

  try {
    const payload = JSON.parse(base64UrlDecode(payloadEncoded))
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp && payload.exp < now) {
      return { valid: false, handle: payload.handle || '', isAdmin: false, reason: 'Token expired' }
    }
    return {
      valid: true,
      handle: String(payload.handle || '').toLowerCase(),
      isAdmin: !!payload.isAdmin,
      reason: 'authenticated',
    }
  } catch (err) {
    return { valid: false, handle: '', isAdmin: false, reason: 'Failed to parse token payload' }
  }
}

module.exports = {
  createSessionToken,
  verifyAuth,
  hashPassword,
  getAdminSecret,
  sendJson,
  checkRateLimit,
  recordFailedAttempt,
  clearFailedAttempt,
}
