import { describe, expect, it } from 'vitest'
import { addScene, deleteScene, movePhoto, moveScene, removePhotoFromScenes } from '@/utils/sceneOps'
import { scene } from './helpers'

describe('sceneOps', () => {
  const base = () => [scene('a', ['1', '2'], { order: 0 }), scene('b', ['3'], { order: 1 })]

  it('moveScene 은 순서를 바꾸고 order 를 다시 매긴다', () => {
    const out = moveScene(base(), 'a', 1)
    expect(out.map((s) => s.id)).toEqual(['b', 'a'])
    expect(out.map((s) => s.order)).toEqual([0, 1])
  })

  it('moveScene 은 범위를 벗어나면 그대로 둔다', () => {
    const s = base()
    expect(moveScene(s, 'a', -1)).toBe(s)
  })

  it('movePhoto 는 사진을 다른 씬으로 옮기고 대표 사진을 보정한다', () => {
    const out = movePhoto(base(), '1', 'b')
    expect(out[0].photoIds).toEqual(['2'])
    expect(out[0].coverPhotoId).toBe('2')
    expect(out[1].photoIds).toEqual(['3', '1'])
  })

  it('removePhotoFromScenes 는 모든 씬에서 사진을 뺀다', () => {
    const out = removePhotoFromScenes(base(), '3')
    expect(out[1].photoIds).toEqual([])
    expect(out[1].coverPhotoId).toBeUndefined()
  })

  it('addScene/deleteScene', () => {
    const added = addScene(base(), 'p1')
    expect(added).toHaveLength(3)
    expect(deleteScene(added, added[2].id)).toHaveLength(2)
  })
})
