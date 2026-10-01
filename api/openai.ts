/**
 * Vercel 서버 함수: 브라우저 대신 OpenAI Chat Completions 를 호출한다.
 * 환경변수 OPENAI_API_KEY 는 Vercel 프로젝트 설정에만 두고 클라이언트에는 노출하지 않는다.
 *
 * ⚠ 공개 서비스로 열기 전에 인증/호출 한도(rate limit)를 추가하세요. 지금은 누구나 이 주소로 호출할 수 있습니다.
 */
const ALLOWED_MODELS = new Set(['gpt-4o-mini', 'gpt-4o'])

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const key = process.env.OPENAI_API_KEY
  if (!key) return res.status(500).json({ error: 'OPENAI_API_KEY is not configured' })

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  if (!body || !ALLOWED_MODELS.has(body.model)) return res.status(400).json({ error: 'Model not allowed' })

  const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify(body),
  })
  res.status(upstream.status).setHeader('Content-Type', 'application/json').send(await upstream.text())
}
