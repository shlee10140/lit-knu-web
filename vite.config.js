import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'azure-api-proxy',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (!req.url?.startsWith('/api/')) return next()

          const targetUrl = 'https://yellow-plant-0de446a00.2.azurestaticapps.net' + req.url
          try {
            const headers = { ...req.headers, host: 'yellow-plant-0de446a00.2.azurestaticapps.net' }
            delete headers['content-length']
            const fetchOpts = {
              method: req.method,
              headers,
            }
            let bodyBuffer = null
            if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
              bodyBuffer = await new Promise((resolve, reject) => {
                const chunks = []
                req.on('data', (c) => chunks.push(c))
                req.on('end', () => resolve(Buffer.concat(chunks)))
                req.on('error', reject)
              })
              if (bodyBuffer && bodyBuffer.length > 0) {
                fetchOpts.body = bodyBuffer
              }
            }

            // 로컬 AI 검증 기록을 Azure Cosmos DB에 영구 저장
            const persistVerification = async (rec) => {
              try {
                await fetch('https://yellow-plant-0de446a00.2.azurestaticapps.net/api/verifications', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(rec),
                })
              } catch (e) {
                console.warn('[Vite Proxy] Verification persist warning:', e.message)
              }
            }

            // Local development handler for AI verify-clicks
            if (req.url.startsWith('/api/verify-clicks') && req.method === 'POST') {
              let parsedBody = {}
              try {
                parsedBody = JSON.parse(fetchOpts.body?.toString('utf-8') || '{}')
              } catch (_) {}
              const { handle, imageBase64, mimeType } = parsedBody
              if (!handle || !imageBase64) {
                res.statusCode = 400
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ success: false, message: 'handle and imageBase64 are required' }))
                return
              }

              if (!globalThis.__verifications) globalThis.__verifications = []

              const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || ''
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
- confidence: number (0.0 to 1.0)`

              const modelsToTry = [
                'gemini-3.5-flash',
                'gemini-3.5-flash-lite',
                'gemini-flash-latest',
                'gemini-3.1-flash-lite',
                'gemini-3.8-flash'
              ]

              let aiResult = null
              let lastError = null

              for (const model of modelsToTry) {
                try {
                  const geminiRes = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                    {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        contents: [
                          {
                            parts: [
                              { text: prompt },
                              { inlineData: { mimeType: mimeType || 'image/png', data: cleanBase64 } },
                            ],
                          },
                        ],
                        generationConfig: { responseMimeType: 'application/json' },
                      }),
                    }
                  )

                  if (!geminiRes.ok) {
                    const errText = await geminiRes.text()
                    lastError = new Error(`Model ${model} (${geminiRes.status}): ${errText}`)
                    continue
                  }

                  const geminiData = await geminiRes.json()
                  const extractedText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text
                  if (extractedText) {
                    const cleaned = extractedText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
                    aiResult = JSON.parse(cleaned)
                    break
                  }
                } catch (e) {
                  lastError = e
                }
              }

              if (!aiResult) {
                const failRecord = {
                  id: `verify_${Date.now()}_${handle}_err`,
                  handle,
                  type: 'verification',
                  memberName: handle,
                  previousClicks: 0,
                  verifiedClicks: null,
                  delta: 0,
                  summaryKorean: `AI 검증 호출 오류 (${lastError?.message || 'Gemini API 503 일시적 지연'})`,
                  evidenceImage: imageBase64.length < 1800000 ? imageBase64 : imageBase64.substring(0, 100000),
                  status: 'REJECTED',
                  createdAt: new Date().toISOString(),
                }
                globalThis.__verifications.unshift(failRecord)
                await persistVerification(failRecord)

                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json')
                res.end(
                  JSON.stringify({
                    success: false,
                    reason: `AI 메일 확인 중 일시적 지연이 발생했습니다. 다시 시도해 주세요. (${lastError?.message || ''})`,
                    details: null,
                  })
                )
                return
              }

              if (!aiResult.isValid || typeof aiResult.clicks !== 'number' || isNaN(aiResult.clicks)) {
                const failRecord = {
                  id: `verify_${Date.now()}_${handle}_rejected`,
                  handle,
                  type: 'verification',
                  memberName: handle,
                  previousClicks: 0,
                  verifiedClicks: typeof aiResult.clicks === 'number' ? aiResult.clicks : null,
                  delta: 0,
                  sender: aiResult.sender || '확인 불가',
                  subject: aiResult.subject || '확인 불가',
                  emailDate: aiResult.date || '확인 불가',
                  summaryKorean: aiResult.summaryKorean || '유효한 Microsoft Student Ambassadors 활동 총계 메일 화면이 아닙니다.',
                  confidence: aiResult.confidence || 0,
                  evidenceImage: imageBase64.length < 1800000 ? imageBase64 : imageBase64.substring(0, 100000),
                  status: 'REJECTED',
                  createdAt: new Date().toISOString(),
                }
                globalThis.__verifications.unshift(failRecord)
                await persistVerification(failRecord)

                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json')
                res.end(
                  JSON.stringify({
                    success: false,
                    reason: aiResult.summaryKorean || '유효한 Microsoft Student Ambassadors 활동 총계 메일 화면이 아닙니다.',
                    details: aiResult,
                  })
                )
                return
              }

              const verifiedClicks = Math.max(0, Math.floor(aiResult.clicks))
              const record = {
                id: `verify_${Date.now()}_${handle}`,
                handle,
                type: 'verification',
                memberName: handle,
                verifiedClicks,
                delta: 0,
                sender: aiResult.sender,
                subject: aiResult.subject,
                emailDate: aiResult.date,
                summaryKorean: aiResult.summaryKorean,
                confidence: aiResult.confidence,
                evidenceImage: imageBase64.length < 1800000 ? imageBase64 : imageBase64.substring(0, 100000),
                status: 'APPROVED',
                createdAt: new Date().toISOString(),
              }

              globalThis.__verifications.unshift(record)
              await persistVerification(record)

              // Forward clicks update to targetUrl /api/clicks
              try {
                await fetch('https://yellow-plant-0de446a00.2.azurestaticapps.net/api/clicks', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ handle, amount: verifiedClicks, isAbsolute: true }),
                })
              } catch (e) {
                console.warn('[Vite Proxy] Clicks sync to Azure warning:', e.message)
              }

              res.statusCode = 200
              res.setHeader('Content-Type', 'application/json')
              res.end(
                JSON.stringify({
                  success: true,
                  verifiedClicks,
                  details: aiResult,
                  record,
                  source: 'dev-gemini-ai',
                })
              )
              return
            }

            if (req.url.startsWith('/api/verifications') && req.method === 'GET') {
              let remoteData = []
              try {
                const proxyRes = await fetch(targetUrl, { method: 'GET', headers: { host: 'yellow-plant-0de446a00.2.azurestaticapps.net' } })
                if (proxyRes.ok) {
                  const json = await proxyRes.json()
                  remoteData = json.data || []
                }
              } catch (_) {}

              const localList = globalThis.__verifications || []
              const map = new Map()
              for (const item of [...localList, ...remoteData]) {
                if (item && item.id && !map.has(item.id)) {
                  map.set(item.id, item)
                }
              }
              const merged = Array.from(map.values()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

              res.statusCode = 200
              res.setHeader('Content-Type', 'application/json')
              res.end(
                JSON.stringify({
                  success: true,
                  count: merged.length,
                  data: merged,
                  source: 'dev-merged',
                })
              )
              return
            }

            const proxyRes = await fetch(targetUrl, fetchOpts)

            if (req.url.startsWith('/api/milestones')) {
              if (['POST', 'PUT'].includes(req.method)) {
                try {
                  const parsed = JSON.parse(fetchOpts.body?.toString('utf-8') || '[]')
                  if (Array.isArray(parsed) && parsed.length > 0) {
                    globalThis.__devMilestones = parsed
                  }
                } catch (_) {}
              }

              if (proxyRes.status === 404) {
                const returnData = globalThis.__devMilestones || [
                  { count: 50, title: '50 달성', icon: '✨', badge: '50 달성', reward: '던킨 미니 도넛 세트', desc: '달콤한 에너지 충전! 첫 마일스톤 달성', color: 'amber' },
                  { count: 100, title: '100 달성', icon: '🔥', badge: '100 달성', reward: '싸이버거 세트', desc: '든든한 한 끼 식사! 세 자릿수 돌파 축하', color: 'pink' },
                  { count: 200, title: '200 달성', icon: '⚡', badge: '200 달성', reward: '배민 상품권', desc: '맛있는 만찬 즐기기! 2만원 배민 상품권', color: 'violet' },
                  { count: 250, title: '250 달성', icon: '👑', badge: 'MSA 달성', reward: 'LIT 명예의 전당 (MSA 달성)', desc: '200명 채우면 250명은 스스로 욕심이 생겨서 달성!', color: 'gold' },
                ]
                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json')
                res.end(
                  JSON.stringify({
                    success: true,
                    count: returnData.length,
                    data: returnData,
                    source: 'dev-fallback',
                  })
                )
                return
              }
            }
            res.statusCode = proxyRes.status
            proxyRes.headers.forEach((val, key) => {
              if (!['content-encoding', 'transfer-encoding', 'connection'].includes(key.toLowerCase())) {
                res.setHeader(key, val)
              }
            })
            const buf = await proxyRes.arrayBuffer()
            res.end(Buffer.from(buf))
          } catch (err) {
            console.error('[Vite Azure Proxy Error]:', err.message)
            res.statusCode = 502
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: false, error: err.message }))
          }
        })
      },
    },
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-motion': ['framer-motion', 'lenis'],
          'vendor-icons': ['lucide-react'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})

