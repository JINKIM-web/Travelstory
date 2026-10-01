import { useEffect, useState } from 'react'
import { fetchHeroBackground, type HeroBackground } from '@/services/unsplash'

/** 메인 화면 히어로 배경. Unsplash 키가 없거나 실패하면 null (그라데이션 대체). */
export function useHeroBackground() {
  const [bg, setBg] = useState<HeroBackground | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let alive = true
    void fetchHeroBackground().then((b) => {
      if (!alive || !b) return
      // 이미지가 실제로 내려온 뒤에 보여줘서 깜빡임을 막는다.
      const img = new Image()
      img.onload = () => {
        if (!alive) return
        setBg(b)
        setLoaded(true)
      }
      img.src = b.url
    })
    return () => {
      alive = false
    }
  }, [])

  return { bg, loaded }
}
