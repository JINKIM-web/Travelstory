const KEY: string | undefined = __UNSPLASH_KEY__ || undefined

export const hasUnsplash = Boolean(KEY)

export interface Background {
  id: string
  /** 이미지 URL 또는 CSS gradient 문자열 */
  value: string
  thumb: string
  credit?: string
  creditUrl?: string
  downloadLocation?: string
}

/** 키가 없을 때/보조로 쓰는 무드 그라데이션 */
export const MOOD_GRADIENTS: Background[] = [
  { id: 'g-sunset', value: 'linear-gradient(160deg,#f6c9a8,#be543c 55%,#5a2418)', thumb: '', credit: '노을' },
  { id: 'g-forest', value: 'linear-gradient(160deg,#cfe0cf,#526254 55%,#1f2a21)', thumb: '', credit: '숲' },
  { id: 'g-sea', value: 'linear-gradient(160deg,#cfe6f0,#4f8aa6 55%,#17394a)', thumb: '', credit: '바다' },
  { id: 'g-snow', value: 'linear-gradient(160deg,#ffffff,#c9d4e6 55%,#6c7a96)', thumb: '', credit: '설원' },
  { id: 'g-night', value: 'linear-gradient(160deg,#4a4e7a,#232845 55%,#0d1020)', thumb: '', credit: '밤' },
].map((g) => ({ ...g, thumb: g.value }))

interface UnsplashPhoto {
  id: string
  urls: { regular: string; small: string }
  user: { name: string; links: { html: string } }
  links: { download_location: string }
}

export async function searchBackgrounds(query: string): Promise<Background[]> {
  if (!KEY) return []
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&orientation=portrait&per_page=8`
  const res = await fetch(url, { headers: { Authorization: `Client-ID ${KEY}` } })
  if (!res.ok) throw new Error(`Unsplash ${res.status}`)
  const json = (await res.json()) as { results: UnsplashPhoto[] }
  return json.results.map((p) => ({
    id: p.id,
    value: p.urls.regular,
    thumb: p.urls.small,
    credit: `Photo by ${p.user.name} on Unsplash`,
    creditUrl: `${p.user.links.html}?utm_source=travelcanvasai&utm_medium=referral`,
    downloadLocation: p.links.download_location,
  }))
}

/** Unsplash API 가이드라인: 사진을 사용할 때 download endpoint 호출 */
export async function trackDownload(bg: Background) {
  if (!KEY || !bg.downloadLocation) return
  try {
    await fetch(bg.downloadLocation, { headers: { Authorization: `Client-ID ${KEY}` } })
  } catch {
    /* 추적 실패는 무시 */
  }
}

// ───────── 메인 화면 히어로 배경 ─────────

export interface HeroBackground {
  url: string
  credit: string
  creditUrl: string
  query: string
}

/** 따뜻하고 여행 감성이 나는 풍경 검색어. 날짜별로 하나씩 돌아가며 쓴다. */
export const HERO_QUERIES = [
  'travel sunset coastline',
  'mountain lake sunrise',
  'old town street golden hour',
  'tropical beach calm water',
  'autumn forest trail',
  'mediterranean village sea',
  'northern lights travel',
  'rice terrace morning mist',
]

const HERO_CACHE_KEY = 'tc:hero-bg'

interface HeroCache {
  day: string
  bg: HeroBackground
}

const today = () => new Date().toISOString().slice(0, 10)

/**
 * 하루에 한 번만 검색해서(캐시) Unsplash API 호출을 아낀다.
 * 키가 없거나 실패하면 null → 화면은 그라데이션 배경을 쓴다.
 */
export async function fetchHeroBackground(): Promise<HeroBackground | null> {
  if (!KEY) return null
  try {
    const cached = JSON.parse(localStorage.getItem(HERO_CACHE_KEY) ?? 'null') as HeroCache | null
    if (cached?.day === today()) return cached.bg
  } catch {
    /* 캐시 없음 */
  }
  try {
    const dayNo = Math.floor(Date.now() / 86_400_000)
    const query = HERO_QUERIES[dayNo % HERO_QUERIES.length]
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&orientation=landscape&content_filter=high&per_page=12`
    const res = await fetch(url, { headers: { Authorization: `Client-ID ${KEY}` } })
    if (!res.ok) throw new Error(`Unsplash ${res.status}`)
    const { results } = (await res.json()) as { results: (UnsplashPhoto & { urls: { raw: string } })[] }
    if (!results.length) return null
    const p = results[dayNo % results.length]
    const bg: HeroBackground = {
      // raw URL 은 imgix 파라미터를 지원한다: 1920px 너비로 잘라 가볍게 받는다.
      url: `${p.urls.raw}&w=1920&h=1000&fit=crop&q=75&auto=format`,
      credit: `Photo by ${p.user.name} on Unsplash`,
      creditUrl: `${p.user.links.html}?utm_source=travelcanvasai&utm_medium=referral`,
      query,
    }
    try {
      localStorage.setItem(HERO_CACHE_KEY, JSON.stringify({ day: today(), bg } satisfies HeroCache))
    } catch {
      /* 저장 실패는 무시 */
    }
    return bg
  } catch (e) {
    console.warn('히어로 배경을 불러오지 못했습니다', e)
    return null
  }
}
