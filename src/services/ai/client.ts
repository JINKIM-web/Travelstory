/**
 * OpenAI 호출 어댑터. 모든 AI 요청은 이 파일만 거친다.
 * 키는 브라우저에 두지 않는다: 요청은 같은 출처의 /api/openai 로 보내고,
 * 개발 서버(vite proxy) 또는 운영 서버 함수(api/openai.ts)가 서버 쪽 키를 붙여 OpenAI 로 전달한다.
 */

const MODEL = (import.meta.env.VITE_OPENAI_MODEL as string | undefined) || 'gpt-4o-mini'

/** 키가 없으면 데모(mock) 모드로 동작한다. (키 유무만 빌드 시점에 주입됨) */
export const hasOpenAI: boolean = __HAS_OPENAI__

type Part = { type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string; detail: 'low' | 'high' } }
export interface ChatMessage {
  role: 'system' | 'user'
  content: string | Part[]
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function chatJSON<T>(
  messages: ChatMessage[],
  { retries = 2, temperature = 0.7 }: { retries?: number; temperature?: number } = {},
): Promise<T> {
  if (!hasOpenAI) throw new Error('OpenAI 키가 설정되지 않았습니다. (.env.local 의 OPENAI_API_KEY)')
  let lastErr: unknown
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch('/api/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: MODEL,
          messages,
          response_format: { type: 'json_object' },
          temperature,
        }),
      })
      if (!res.ok) {
        const retryable = res.status === 429 || res.status >= 500
        const err = new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 200)}`)
        if (!retryable) throw Object.assign(err, { fatal: true })
        throw err
      }
      const json = await res.json()
      return JSON.parse(json.choices[0].message.content) as T
    } catch (e) {
      lastErr = e
      if ((e as { fatal?: boolean }).fatal) break
      await sleep(800 * (attempt + 1))
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('AI 요청 실패')
}
