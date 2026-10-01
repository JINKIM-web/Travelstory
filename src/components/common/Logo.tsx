import { useId } from 'react'
import { cn } from '@/utils/cn'

/** 여행 핀 + 풍경 사진 + AI 반짝임. public/favicon.svg 와 같은 모양. */
export function LogoMark({ className }: { className?: string }) {
  const id = useId()
  return (
    <svg viewBox="0 0 64 64" className={cn('h-9 w-9 shrink-0', className)} aria-hidden>
      <defs>
        <linearGradient id={id} x1="8" y1="4" x2="56" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f08a6c" />
          <stop offset="1" stopColor="#b9452c" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill={`url(#${id})`} />
      <path
        d="M32 10c-9.4 0-17 7.3-17 16.4 0 12.2 14.4 24.3 16.1 25.7a1.4 1.4 0 0 0 1.8 0C34.6 50.7 49 38.6 49 26.4 49 17.3 41.4 10 32 10Z"
        fill="#fff"
      />
      <circle cx="38.5" cy="21" r="3.2" fill="#f4a261" />
      <path d="M21.5 34.5 29 24.5l5.2 6.6 3.1-3.6 6.2 7Z" fill="#b9452c" />
      <path d="M21.5 34.5 27 28l5.2 6.5Z" fill="#8f3320" />
      <path d="M51 6.5l1.3 3.2 3.2 1.3-3.2 1.3L51 15.5l-1.3-3.2-3.2-1.3 3.2-1.3Z" fill="#fff" />
    </svg>
  )
}

/** 아이콘 + 워드마크. light=true 는 어두운 배경 위에서 쓰는 흰색 글자. */
export default function Logo({ className, light }: { className?: string; light?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark />
      <span className={cn('text-[19px] font-extrabold leading-none tracking-tight', light ? 'text-white' : 'text-on-surface')}>
        Travel<span className={light ? 'text-[#ffb59f]' : 'text-primary-container'}>Canvas</span>
        <span className={cn('ml-0.5 align-super text-[10px] font-bold', light ? 'text-white/80' : 'text-on-surface-variant')}>AI</span>
      </span>
    </span>
  )
}
