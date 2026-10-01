import { describe, expect, it } from 'vitest'
import { remapIds } from '@/services/backup'

describe('remapIds', () => {
  it('projectId 와 photoId 를 모두 새 ID 로 바꾸고 구조는 그대로 둔다', () => {
    const text = JSON.stringify({
      project: { id: 'proj-1', photoIds: ['ph-1', 'ph-2'] },
      scenes: [{ projectId: 'proj-1', photoIds: ['ph-2'] }],
    })
    const { text: out, photoMap } = remapIds(text, 'proj-1', ['ph-1', 'ph-2'])
    expect(out).not.toContain('proj-1')
    expect(out).not.toContain('ph-1')
    expect(out).not.toContain('ph-2')
    expect(photoMap.size).toBe(2)
    const parsed = JSON.parse(out)
    expect(parsed.project.id).toBe(parsed.scenes[0].projectId)
    expect(parsed.scenes[0].photoIds[0]).toBe(photoMap.get('ph-2'))
  })
})
