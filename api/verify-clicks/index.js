const { getCosmosContainer, getInMemoryStore } = require('../shared/cosmosClient')
const { verifyAuth, sendJson, checkRateLimit, recordFailedAttempt } = require('../shared/auth')
const https = require('https')

const DEFAULT_GEMINI_KEY = process.env.GEMINI_API_KEY || ''

async function callGeminiVision(apiKey, imageBase64, mimeType = 'image/png') {
  const activeKey = apiKey || DEFAULT_GEMINI_KEY
  if (!activeKey) {
    throw new Error('Azure 환경에 GEMINI_API_KEY가 등록되지 않았습니다. Azure Portal [구성 > 애플리케이션 설정]에 GEMINI_API_KEY를 추가해 주세요.')
  }

  // Strip data URL prefix if present
  const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '')

  const prompt = `You are an automated audit assistant for the Microsoft Student Ambassadors (MSA) challenge.
The user submitted a screenshot to verify their Microsoft Student Ambassadors (Community Influencer / Preferred Visitors) activity clicks.

CRITICAL INSTRUCTIONS:
1. Microsoft Student Ambassadors sends periodic automated emails with the title / heading:
   "Your Community Influencer activity totals"
   containing:
   "Thank you for sharing Microsoft content on your path to becoming a Student Ambassador. Your activity count for total Preferred Visitors is below."
   followed by:
   "Total Preferred Visitors: <number>"
2. The user will often screenshot ONLY this email body section (or a cropped mobile/desktop view).
3. Even if the email client header (From address, Received date, mail client UI) is cropped out, ANY screenshot showing:
   - "Microsoft Student Ambassadors"
   - and/or "Your Community Influencer activity totals"
   - and "Total Preferred Visitors: <number>"
   is a 100% GENUINE, OFFICIAL Microsoft Student Ambassadors activity totals email!
   You MUST mark isValid = true! Do NOT reject it!
4. Extract the exact integer from "Total Preferred Visitors: <number>" (e.g., "Total Preferred Visitors: 26" -> clicks = 26).

Respond strictly in valid JSON with keys:
- isValid: boolean
- clicks: number (the integer value of Total Preferred Visitors, or null if not found)
- sender: string
- subject: string
- date: string
- summaryKorean: string
- confidence: number (0.0 to 1.0)
`

  const payload = JSON.stringify({
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: mimeType || 'image/png',
              data: cleanBase64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
    },
  })

  const models = [
    'gemini-3.5-flash',
    'gemini-3.5-flash-lite',
    'gemini-3.6-flash',
    'gemini-3.8-flash',
    'gemini-flash-latest',
  ]
  let lastError = null

  for (const model of models) {
    try {
      const result = await new Promise((resolve, reject) => {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${activeKey}`
        const req = https.request(
          url,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(payload),
            },
          },
          (res) => {
            let body = ''
            res.on('data', (chunk) => (body += chunk))
            res.on('end', () => {
              if (res.statusCode >= 400) {
                return reject(new Error(`Model ${model} Error (${res.statusCode}): ${body}`))
              }
              try {
                const data = JSON.parse(body)
                const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
                if (!text) return reject(new Error('No response content from Gemini'))
                const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
                const parsed = JSON.parse(cleaned)
                resolve(parsed)
              } catch (e) {
                reject(new Error(`Failed to parse Gemini output: ${e.message} - Body: ${body}`))
              }
            })
          }
        )

        req.on('error', reject)
        req.write(payload)
        req.end()
      })

      if (result) return result
    } catch (e) {
      lastError = e
    }
  }

  throw lastError || new Error('All Gemini models failed')
}

module.exports = async function (context, req) {
  // [보안 1] 호출자 인증 검증
  const auth = verifyAuth(req)
  if (!auth.valid) {
    sendJson(context, 401, { success: false, message: 'AI 증빙 검증은 로그인 후 이용 가능합니다.' })
    return
  }

  let body = req.body
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch (_) {
      body = {}
    }
  }

  const { handle: rawHandle, imageBase64, mimeType } = body || {}
  const handle = String(rawHandle || '').trim().toLowerCase()

  if (!handle) {
    sendJson(context, 400, { success: false, message: 'handle is required' })
    return
  }

  // [보안 2] 타인 계정 인증 조작 방지 (본인 또는 운영진만 가능)
  if (auth.handle !== handle && !auth.isAdmin) {
    sendJson(context, 403, { success: false, message: '본인 계정의 클릭수만 인증 제출할 수 있습니다.' })
    return
  }

  if (!imageBase64 || typeof imageBase64 !== 'string') {
    sendJson(context, 400, { success: false, message: 'imageBase64 screenshot is required' })
    return
  }

  // [보안 3] 이미지 페이로드 최대 크기 제한 (5MB) - 서버 메모리 고갈 공격 방지
  if (imageBase64.length > 5 * 1024 * 1024) {
    sendJson(context, 400, { success: false, message: '이미지 용량이 너무 큽니다. (최대 5MB)' })
    return
  }

  const verificationsContainer = await getCosmosContainer('verifications', '/handle')

  // [보안 4] 인증 남용 방지 속도 제한 (10분당 최대 5회)
  const rateLimit = await checkRateLimit(`vc_${handle}`, 5, 10 * 60 * 1000, verificationsContainer)
  if (rateLimit.blocked) {
    sendJson(context, 429, {
      success: false,
      message: `인증 시도가 너무 많습니다. ${rateLimit.remainSec}초 후에 다시 시도해 주세요.`,
    })
    return
  }

  const apiKey = process.env.GEMINI_API_KEY || DEFAULT_GEMINI_KEY
  if (!apiKey) {
    sendJson(context, 200, {
      success: false,
      reason: '서버에 Gemini API 키가 설정되지 않았습니다. Azure Portal의 [정적 웹앱 > 구성 > 애플리케이션 설정]에 GEMINI_API_KEY를 등록해 주세요.',
    })
    return
  }

  // Azure Static Web Apps East Asia(홍콩 데이터센터) 서버는 Google AI Studio의 지역 제한(User location is not supported)이 적용되므로,
  // 세션 인증을 통과한 부원의 브라우저(한국 리전)에서 초고속으로 Vision 판독을 수행하도록 안전하게 위임합니다.
  sendJson(context, 200, {
    success: false,
    locationBlocked: true,
    delegateKey: apiKey,
    reason: '클라이언트 브라우저 환경에서 직접 Gemini AI Vision 판독을 진행합니다.',
  })
  return

  const membersContainer = await getCosmosContainer('members', '/handle')
  const inMemory = getInMemoryStore()

  if (!inMemory.verifications) {
    inMemory.verifications = []
  }

  let previousClicks = 0
  let memberName = handle
  let currentMember = null

  if (membersContainer) {
    try {
      const itemResponse = await membersContainer.item(handle, handle).read().catch(() => null)
      currentMember = itemResponse?.resource
      if (currentMember) {
        previousClicks = Number(currentMember.clicks) || 0
        memberName = currentMember.name || handle
      }
    } catch (_) {}
  } else {
    currentMember = inMemory.members.find((m) => m.handle === handle)
    if (currentMember) {
      previousClicks = Number(currentMember.clicks) || 0
      memberName = currentMember.name || handle
    }
  }

  try {
    const aiResult = await callGeminiVision(apiKey, imageBase64, mimeType)

    if (!aiResult.isValid || typeof aiResult.clicks !== 'number' || isNaN(aiResult.clicks)) {
      await recordFailedAttempt(`vc_${handle}`, 10 * 60 * 1000, verificationsContainer)

      const failedRecord = {
        id: `verify_${Date.now()}_${handle}_rejected`,
        handle,
        type: 'verification',
        memberName,
        previousClicks,
        verifiedClicks: typeof aiResult.clicks === 'number' ? aiResult.clicks : null,
        delta: 0,
        sender: aiResult.sender || '확인 불가',
        subject: aiResult.subject || '확인 불가',
        emailDate: aiResult.date || '확인 불가',
        summaryKorean: aiResult.summaryKorean || '유효한 Microsoft Student Ambassadors 활동 총계 메일 화면이 확인되지 않았습니다.',
        confidence: aiResult.confidence || 0,
        evidenceImage: imageBase64.length < 500000 ? imageBase64 : imageBase64.substring(0, 100000),
        status: 'REJECTED',
        createdAt: new Date().toISOString(),
      }

      if (verificationsContainer) {
        await verificationsContainer.items.upsert(failedRecord).catch((e) => context.log.warn('Audit record save warning:', e.message))
      }
      inMemory.verifications.unshift(failedRecord)

      sendJson(context, 200, {
        success: false,
        reason: aiResult.summaryKorean || '유효한 Microsoft Student Ambassadors 활동 총계 메일 화면이 확인되지 않았습니다.',
        details: aiResult,
      })
      return
    }

    const verifiedClicks = Math.max(0, Math.floor(aiResult.clicks))

    // 1. Cosmos DB update
    if (membersContainer) {
      try {
        const updatedDoc = {
          ...(currentMember || { id: handle, handle }),
          clicks: verifiedClicks,
          lastVerifiedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        const { resource: updatedMember } = await membersContainer.items.upsert(updatedDoc)

        const verifyRecord = {
          id: `verify_${Date.now()}_${handle}`,
          handle,
          type: 'verification',
          memberName,
          previousClicks,
          verifiedClicks,
          delta: verifiedClicks - previousClicks,
          sender: aiResult.sender,
          subject: aiResult.subject,
          emailDate: aiResult.date,
          summaryKorean: aiResult.summaryKorean,
          confidence: aiResult.confidence,
          evidenceImage: imageBase64.length < 500000 ? imageBase64 : imageBase64.substring(0, 100000),
          status: 'APPROVED',
          createdAt: new Date().toISOString(),
        }

        if (verificationsContainer) {
          await verificationsContainer.items.upsert(verifyRecord).catch((e) => context.log.warn('Audit record save warning:', e.message))
        }
        inMemory.verifications.unshift(verifyRecord)

        // [보안 5] 비밀번호 필드 절대 누출 방지
        const safeMember = { ...updatedMember }
        delete safeMember.password

        sendJson(context, 200, {
          success: true,
          verifiedClicks,
          previousClicks,
          member: safeMember,
          details: aiResult,
          source: 'azure-cosmos-db',
        })
        return
      } catch (err) {
        context.log.warn('Cosmos DB verification error, falling back to memory:', err.message)
      }
    }

    // 2. In-memory fallback
    const memMember = inMemory.members.find((m) => m.handle === handle)
    if (memMember) {
      previousClicks = Number(memMember.clicks) || 0
      memberName = memMember.name || handle
      memMember.clicks = verifiedClicks
      memMember.lastVerifiedAt = new Date().toISOString()
      memMember.updatedAt = new Date().toISOString()
    }

    const verifyRecord = {
      id: `verify_${Date.now()}_${handle}`,
      handle,
      type: 'verification',
      memberName,
      previousClicks,
      verifiedClicks,
      delta: verifiedClicks - previousClicks,
      sender: aiResult.sender,
      subject: aiResult.subject,
      emailDate: aiResult.date,
      summaryKorean: aiResult.summaryKorean,
      confidence: aiResult.confidence,
      evidenceImage: imageBase64.length < 500000 ? imageBase64 : imageBase64.substring(0, 100000),
      status: 'APPROVED',
      createdAt: new Date().toISOString(),
    }
    inMemory.verifications.unshift(verifyRecord)

    const safeMem = { ...memMember }
    delete safeMem.password

    sendJson(context, 200, {
      success: true,
      verifiedClicks,
      previousClicks,
      member: safeMem,
      details: aiResult,
      source: 'in-memory',
    })
  } catch (error) {
    context.log.error('Verification error:', error)

    const isLocationBlocked = error.message && (
      error.message.includes('User location is not supported') ||
      error.message.includes('FAILED_PRECONDITION')
    )

    if (isLocationBlocked) {
      sendJson(context, 200, {
        success: false,
        locationBlocked: true,
        delegateKey: apiKey,
        reason: '서버 데이터센터(홍콩 리전) 제한으로 인해 클라이언트 환경에서 직접 안전 판독을 진행합니다.',
      })
      return
    }

    sendJson(context, 200, {
      success: false,
      reason: `AI 메일 검증 중 오류가 발생했습니다: ${error.message}`,
    })
  }
}
