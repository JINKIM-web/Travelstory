import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/utils/cn'

/** 논리 크기(w×h)의 자식을 부모 너비에 맞춰 축소해서 보여준다. */
export default function ScaledPage({ w, h, children, className }: { w: number; h: number; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.5)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setScale(el.clientWidth / w)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [w])
  return (
    <div ref={ref} className={cn('relative w-full overflow-hidden', className)} style={{ height: h * scale }}>
      <div style={{ width: w, height: h, transform: `scale(${scale})`, transformOrigin: 'top left' }}>{children}</div>
    </div>
  )
}
