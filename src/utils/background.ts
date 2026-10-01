import type { CSSProperties } from 'react'

/** 그라데이션 문자열 또는 이미지 URL 을 CSS 배경으로 변환 */
export function bgStyle(value?: string, fallback = '#3a2a26'): CSSProperties {
  if (!value) return { background: fallback }
  if (value.startsWith('linear-gradient')) return { background: value }
  return { backgroundImage: `url(${value})`, backgroundSize: 'cover', backgroundPosition: 'center' }
}
