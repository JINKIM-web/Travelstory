import { describe, expect, it } from 'vitest'
import { buildStorybook, chapterNumbers, layoutFor } from '@/services/storybook/build'
import { project, scene, story } from './helpers'

describe('buildStorybook', () => {
  const scenes = [scene('a', ['1']), scene('b', ['2', '3', '4', '5', '6', '7', '8']), scene('c', [])]
  const book = buildStorybook({ project: project(), story: story(['a', 'b', 'c']), scenes, card: null })

  it('표지 → 프롤로그 → 챕터 → 인용 → 에필로그 → 뒷표지 순서로 구성한다', () => {
    const kinds = book.pages.map((p) => p.kind)
    expect(kinds[0]).toBe('cover')
    expect(kinds[1]).toBe('intro')
    expect(kinds.slice(-3)).toEqual(['quote', 'closing', 'back'])
  })

  it('사진 수에 따라 레이아웃을 고른다', () => {
    expect([0, 1, 2, 3].map(layoutFor)).toEqual(['text', 'full', 'duo', 'trio'])
  })

  it('한 씬 사진은 최대 6장(2쪽)까지만 쓰고, 이어지는 쪽은 continued 로 표시한다', () => {
    const chapters = book.pages.filter((p) => p.kind === 'chapter')
    const b = chapters.filter((p) => p.sceneId === 'b')
    expect(b).toHaveLength(2)
    expect(b[0].photoIds).toHaveLength(3)
    expect(b[1].continued).toBe(true)
    expect(b[1].photoIds).toHaveLength(3)
  })

  it('사진이 없는 씬은 텍스트 쪽이 된다', () => {
    const c = book.pages.find((p) => p.kind === 'chapter' && p.sceneId === 'c')
    expect(c && c.kind === 'chapter' && c.layout).toBe('text')
  })

  it('챕터 번호는 이어지는 쪽을 세지 않는다', () => {
    const nums = [...chapterNumbers(book.pages).values()]
    expect(nums).toEqual([1, 2, 3])
  })

  it('표지 부제에 여행지와 기간이 들어간다', () => {
    const cover = book.pages[0]
    expect(cover.kind === 'cover' && cover.subtitle).toContain('제주')
  })
})
