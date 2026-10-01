import { describe, expect, it } from 'vitest'
import { arrange, buildStorybook, photoInfoMap, recommendSize, splitEven } from '@/services/storybook/build'
import type { TravelPhoto } from '@/types'
import type { ChapterPage } from '@/types/storybook'
import { analysis, photo, project, scene, story } from './helpers'

const withSize = (id: string, w: number, h: number): TravelPhoto => ({ ...photo(id), width: w, height: h })

describe('splitEven', () => {
  it('쪽당 최대 3장으로 고르게 나누고 1장짜리 쪽을 만들지 않는다', () => {
    expect(splitEven(1)).toEqual([1])
    expect(splitEven(3)).toEqual([3])
    expect(splitEven(4)).toEqual([2, 2])
    expect(splitEven(5)).toEqual([3, 2])
    expect(splitEven(6)).toEqual([3, 3])
    expect(splitEven(0)).toEqual([])
  })
})

describe('arrange', () => {
  const photos = [withSize('l1', 4000, 2250), withSize('l2', 4000, 2250), withSize('p1', 2250, 4000), withSize('p2', 2250, 4000)]
  const map = photoInfoMap(photos, [analysis('p1', '풍경', 9), analysis('l1', '풍경', 3), analysis('l2', '풍경', 8)])

  it('가로 사진 2장은 위아래(stack), 세로 사진이 섞이면 나란히(row)', () => {
    expect(arrange(['l1', 'l2'], map)).toMatchObject({ layout: 'duo', variant: 'stack' })
    expect(arrange(['l1', 'p1'], map)).toMatchObject({ layout: 'duo', variant: 'row' })
    expect(arrange(['p1', 'p2'], map)).toMatchObject({ layout: 'duo', variant: 'row' })
  })

  it('3장은 중요도가 가장 높은 사진을 맨 앞(히어로)에 둔다', () => {
    const a = arrange(['l1', 'l2', 'p2'], map)
    expect(a.layout).toBe('trio')
    expect(a.photoIds[0]).toBe('l2')
    expect(a.variant).toBe('top') // 가로 히어로는 위에 넓게
  })

  it('세로 히어로는 왼쪽에 길게(left)', () => {
    const a = arrange(['l1', 'p1', 'l2'], map)
    expect(a.photoIds[0]).toBe('p1')
    expect(a.variant).toBe('left')
  })

  it('1장은 full, 0장은 text', () => {
    expect(arrange(['l1'], map).layout).toBe('full')
    expect(arrange([], map).layout).toBe('text')
  })
})

describe('recommendSize', () => {
  it('세로 사진이 절반 이상이면 A5, 아니면 정사각형', () => {
    expect(recommendSize([withSize('a', 4000, 2250), withSize('b', 4000, 2250), withSize('c', 2250, 4000)])).toBe('square')
    expect(recommendSize([withSize('a', 2250, 4000), withSize('b', 2250, 4000), withSize('c', 4000, 2250)])).toBe('a5')
    expect(recommendSize([])).toBe('square')
  })
})

describe('buildStorybook 최적화', () => {
  const photos = ['1', '2', '3', '4', '5', '6', '7', '8'].map((id) => withSize(id, 4000, 2250))
  const analyses = [analysis('1', '풍경', 2), analysis('2', '풍경', 9), analysis('3', '풍경', 1), analysis('4', '풍경', 8), analysis('5', '풍경', 7), analysis('6', '풍경', 6), analysis('7', '풍경', 5), analysis('8', '풍경', 1)]
  const chapters = (b: ReturnType<typeof buildStorybook>) => b.pages.filter((p): p is ChapterPage => p.kind === 'chapter')

  it('씬 사진이 6장을 넘으면 중요도 상위 6장만 쓰고 촬영 순서를 유지한다', () => {
    const sc = scene('a', ['1', '2', '3', '4', '5', '6', '7', '8'])
    const book = buildStorybook({ project: project(), story: story(['a']), scenes: [sc], card: null, photos, analyses })
    const used = chapters(book).flatMap((c) => c.photoIds)
    expect(used).toHaveLength(6)
    expect(used).not.toContain('3') // 중요도 1
    expect(used).not.toContain('8') // 중요도 1
  })

  it('4장은 2+2 로 나뉘어 1장짜리 쪽이 없다', () => {
    const sc = scene('a', ['1', '2', '3', '4'])
    const book = buildStorybook({ project: project(), story: story(['a']), scenes: [sc], card: null, photos, analyses })
    expect(chapters(book).map((c) => c.photoIds.length)).toEqual([2, 2])
  })

  it('본문이 길면 글만 있는 쪽 + 사진 쪽으로 나눈다', () => {
    const st = story(['a'])
    st.sections[0].body = '가'.repeat(400)
    const sc = scene('a', ['1', '2', '3'])
    const book = buildStorybook({ project: project(), story: st, scenes: [sc], card: null, photos, analyses, size: 'square' })
    const ch = chapters(book)
    expect(ch[0].layout).toBe('text')
    expect(ch[0].body).toHaveLength(400)
    expect(ch[1].continued).toBe(true)
    expect(ch[1].photoIds).toHaveLength(3)
  })

  it('A5 에서는 같은 본문이 한 쪽에 사진과 함께 들어간다', () => {
    const st = story(['a'])
    st.sections[0].body = '가'.repeat(300)
    const sc = scene('a', ['1', '2', '3'])
    const book = buildStorybook({ project: project(), story: st, scenes: [sc], card: null, photos, analyses, size: 'a5' })
    expect(chapters(book)).toHaveLength(1)
    expect(chapters(book)[0].layout).toBe('trio')
  })

  it('판형을 지정하지 않으면 사진 비율로 추천한다', () => {
    const portrait = ['1', '2', '3'].map((id) => withSize(id, 2250, 4000))
    const book = buildStorybook({ project: project(), story: story(['a']), scenes: [scene('a', ['1', '2', '3'])], card: null, photos: portrait })
    expect(book.size).toBe('a5')
  })
})
