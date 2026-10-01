/// <reference types="vite/client" />

/** vite.config.ts 의 define 으로 주입: OpenAI 키가 설정돼 있는지 */
declare const __HAS_OPENAI__: boolean

/** vite.config.ts 의 define 으로 주입: Unsplash Access Key (VITE_UNSPLASH_ACCESS_KEY 또는 UNSPLASH_ACCESS_KEY) */
declare const __UNSPLASH_KEY__: string
