import type { PhotoAnalysis, StoryCard, StoryProject, TravelPhoto, TravelScene, TravelStory } from '@/types'
import type { BookPage, BookSize, BookTheme, ChapterLayout, ChapterPage, ChapterVariant, Storybook } from '@/types/storybook'
import { formatRange } from '@/utils/date'
import { newId, nowIso } from '@/utils/id'

/** 논리 크기(px). 화면에서는 scale 로 줄이고, 인쇄/내보내기에서는 이 크기 그대로 쓴다. */
export const PAGE_SIZE: Record<BookSize, { w: number; h: number; label: string }> = {
  square: { w: 600, h: 600, label: '정사각형' },
  a5: { w: 559, h: 794, label: 'A5 세로' },
}

export const MAX_PHOTOS_PER_PAGE = 3
export const MAX_PHOTOS_PER_SCENE = 6
export const LAYOUT_CAPACITY: Record<ChapterLayout, number> = { text: 0, full: 1, duo: 2, trio: 3 }

/** 사진이 함께 있는 쪽에서 본문이 넘치지 않는 대략의 글자 수 */
const TEXT_BUDGET: Record<BookSize, Record<ChapterLayout, number>> = {
  square: { text: 560, full: 230, duo: 200, trio: 200 },
  a5: { text: 960, full: 440, duo: 380, trio: 380 },
}

export const layoutFor = (n: number): ChapterLayout => (n === 0 ? 'text' : n === 1 ? 'full' : n === 2 ? 'duo' : 'trio')

export interface PhotoInfo {
  /** 가로/세로 비율 (모르면 1.5 = 일반적인 가로 사진) */
  ratio: number
  /** 중요도 1~10 (모르면 5) */
  score: number
}
export type PhotoInfoMap = Map<string, PhotoInfo>

export function photoInfoMap(photos: TravelPhoto[], analyses: PhotoAnalysis[] = []): PhotoInfoMap {
  const score = new Map(analyses.map((a) => [a.photoId, a.importanceScore]))
  return new Map(
    photos.map((p) => [p.id, { ratio: p.width && p.height ? p.width / p.height : 1.5, score: score.get(p.id) ?? 5 }]),
  )
}

const info = (m: PhotoInfoMap, id: string): PhotoInfo => m.get(id) ?? { ratio: 1.5, score: 5 }
const isLandscape = (r: number) => r >= 1.15
const isPortrait = (r: number) => r <= 0.9

/** 사진 비율 분포로 판형 추천: 세로 사진이 절반 이상이면 A5 세로, 아니면 정사각형 */
export function recommendSize(photos: TravelPhoto[]): BookSize {
  const known = photos.filter((p) => p.width && p.height)
  if (known.length === 0) return 'square'
  const portrait = known.filter((p) => p.width! / p.height! <= 0.9).length
  return portrait / known.length >= 0.5 ? 'a5' : 'square'
}

/** n장을 쪽당 최대 3장으로, 고르게 나눈다. (4 → 2+2, 5 → 3+2, 6 → 3+3: 1장짜리 쪽이 생기지 않게) */
export function splitEven(n: number, max = MAX_PHOTOS_PER_PAGE): number[] {
  if (n <= 0) return []
  const pages = Math.ceil(n / max)
  const base = Math.floor(n / pages)
  const extra = n % pages
  return Array.from({ length: pages }, (_, i) => base + (i < extra ? 1 : 0))
}

export interface Arrangement {
  layout: ChapterLayout
  variant?: ChapterVariant
  /** 배치 순서(3장이면 가장 돋보이는 사진이 맨 앞) */
  photoIds: string[]
}

/** 사진 비율·중요도에 맞춰 레이아웃을 고른다. */
export function arrange(ids: string[], map: PhotoInfoMap): Arrangement {
  const n = ids.length
  if (n === 0) return { layout: 'text', photoIds: [] }
  if (n === 1) return { layout: 'full', photoIds: ids }
  if (n === 2) {
    const [a, b] = ids.map((id) => info(map, id).ratio)
    // 둘 다 가로 사진이면 위아래로 쌓아 크게, 세로 사진이 있으면 나란히
    return { layout: 'duo', variant: isLandscape(a) && isLandscape(b) ? 'stack' : 'row', photoIds: ids }
  }
  // 히어로: 중요도가 가장 높은 사진(동점이면 앞 사진)
  const hero = ids.reduce((best, id) => (info(map, id).score > info(map, best).score ? id : best), ids[0])
  const others = ids.filter((id) => id !== hero)
  const heroRatio = info(map, hero).ratio
  // 세로 히어로는 왼쪽에 길게, 가로 히어로는 위에 넓게
  return { layout: 'trio', variant: isPortrait(heroRatio) || !isLandscape(heroRatio) ? 'left' : 'top', photoIds: [hero, ...others] }
}

export interface BuildInput {
  project: StoryProject
  story: TravelStory
  scenes: TravelScene[]
  card: StoryCard | null
  photos?: TravelPhoto[]
  analyses?: PhotoAnalysis[]
  theme?: BookTheme
  /** 지정하지 않으면 사진 비율로 추천 */
  size?: BookSize
}

/** 스토리·씬·카드·사진 정보로 책 페이지를 자동 구성한다. (AI 호출 없음) */
export function buildStorybook({ project, story, scenes, card, photos = [], analyses = [], theme = 'editorial', size }: BuildInput): Storybook {
  const bookSize = size ?? recommendSize(photos)
  const map = photoInfoMap(photos, analyses)
  const pages: BookPage[] = []
  const subtitle = [project.destination, formatRange(project.startDate, project.endDate)].filter(Boolean).join(' · ')

  pages.push({
    id: newId(),
    kind: 'cover',
    title: story.title,
    subtitle,
    photoId: card?.coverPhotoId ?? scenes.find((s) => s.coverPhotoId)?.coverPhotoId ?? scenes[0]?.photoIds[0],
  })

  if (story.introduction || story.summary) {
    pages.push({ id: newId(), kind: 'intro', body: story.introduction ?? '', quote: story.summary })
  }

  for (const section of story.sections) {
    const scene = scenes.find((s) => s.id === section.sceneId)
    let ids = scene?.photoIds ?? []
    // 사진이 많으면 중요도 상위 사진만 남기고 촬영 순서는 유지
    if (ids.length > MAX_PHOTOS_PER_SCENE) {
      const keep = new Set([...ids].sort((a, b) => info(map, b).score - info(map, a).score).slice(0, MAX_PHOTOS_PER_SCENE))
      ids = ids.filter((id) => keep.has(id))
    }
    const chunks: string[][] = []
    let at = 0
    for (const size of splitEven(ids.length)) {
      chunks.push(ids.slice(at, at + size))
      at += size
    }
    if (chunks.length === 0) chunks.push([])

    // 본문이 사진과 함께 들어가기엔 길면: 글만 있는 쪽 + 사진 쪽으로 나눈다
    const firstArr = arrange(chunks[0], map)
    const overflow = section.body.length > TEXT_BUDGET[bookSize][firstArr.layout] && chunks[0].length > 0
    const makePage = (chunk: string[], opts: Partial<ChapterPage>): ChapterPage => {
      const a = arrange(chunk, map)
      return {
        id: newId(),
        kind: 'chapter',
        sceneId: section.sceneId,
        heading: section.heading,
        body: '',
        layout: a.layout,
        variant: a.variant,
        photoIds: a.photoIds,
        captions: {},
        ...opts,
      }
    }

    if (overflow) {
      pages.push(makePage([], { body: section.body, layout: 'text' }))
      chunks.forEach((c) => pages.push(makePage(c, { continued: true })))
    } else {
      chunks.forEach((c, i) => pages.push(makePage(c, i === 0 ? { body: section.body } : { continued: true })))
    }
  }

  if (story.goldenQuote) pages.push({ id: newId(), kind: 'quote', text: story.goldenQuote })
  pages.push({ id: newId(), kind: 'closing', body: story.closing ?? '', tags: story.tags ?? [] })
  pages.push({ id: newId(), kind: 'back' })

  const now = nowIso()
  return {
    id: newId(),
    projectId: project.id,
    theme,
    size: bookSize,
    pages,
    background: card?.backgroundUrl,
    backgroundCredit: card?.backgroundCredit,
    autoGeneratedAt: now,
    updatedAt: now,
  }
}

/** 챕터 번호(이어지는 쪽 제외) 계산 */
export function chapterNumbers(pages: BookPage[]): Map<string, number> {
  const m = new Map<string, number>()
  let n = 0
  for (const p of pages) if (p.kind === 'chapter' && !p.continued) m.set(p.id, ++n)
  return m
}

export function newPage(kind: BookPage['kind']): BookPage {
  const id = newId()
  switch (kind) {
    case 'cover':
      return { id, kind, title: '제목', subtitle: '' }
    case 'intro':
      return { id, kind, body: '', quote: '' }
    case 'chapter':
      return { id, kind, heading: '새 챕터', body: '', layout: 'text', photoIds: [], captions: {} }
    case 'quote':
      return { id, kind, text: '여기에 문장을 적어 보세요.' }
    case 'closing':
      return { id, kind, body: '', tags: [] }
    case 'back':
      return { id, kind }
  }
}
