import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // 서버 쪽 키: OPENAI_API_KEY 권장. (기존 VITE_OPENAI_API_KEY 도 호환)
  const openaiKey = env.OPENAI_API_KEY || env.VITE_OPENAI_API_KEY || ''

  return {
    plugins: [react(), tailwindcss()],
    resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
    // 키 자체는 번들에 넣지 않고 "키가 있는지"만 알려준다.
    define: { __HAS_OPENAI__: JSON.stringify(Boolean(openaiKey)) },
    server: {
      proxy: {
        // 브라우저 → /api/openai → (개발 서버가 키를 붙여) OpenAI. 운영에서는 api/openai.ts 가 같은 역할을 한다.
        '/api/openai': {
          target: 'https://api.openai.com',
          changeOrigin: true,
          rewrite: () => '/v1/chat/completions',
          headers: { Authorization: `Bearer ${openaiKey}` },
        },
      },
    },
    test: { environment: 'node', include: ['src/**/*.test.ts'] },
  }
})
