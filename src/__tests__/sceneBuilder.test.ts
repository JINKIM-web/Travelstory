import { describe, expect, it } from 'vitest'
import { clusterPhotos } from '@/services/ai/sceneBuilder'
import { analysis, photo } from './helpers'

describe('clusterPhotos', () => {
  it('촬영 시각 간격이 2.5시간을 넘으면 씬을 나눈다', () => {
    const photos = [
      photo('1', '2025-02-03T10:00:00'),
      photo('2', '2025-02-03T10:20:00'),
      photo('3', '2025-02-03T15:00:00'),
      photo('4', '2025-02-03T15:10:00'),
    ]
    const out = clusterPhotos(photos, [])
    expect(out.map((c) => c.map((p) => p.id))).toEqual([['1', '2'], ['3', '4']])
  })

  it('날짜가 바뀌면 씬을 나눈다', () => {
    const photos = [
      photo('1', '2025-02-03T23:30:00'),
      photo('2', '2025-02-03T23:50:00'),
      photo('3', '2025-02-04T00:10:00'),
      photo('4', '2025-02-04T00:20:00'),
    ]
    expect(clusterPhotos(photos, [])).toHaveLength(2)
  })

  it('촬영 시각순으로 정렬한다', () => {
    const photos = [photo('b', '2025-02-03T11:00:00'), photo('a', '2025-02-03T10:00:00')]
    expect(clusterPhotos(photos, [])[0].map((p) => p.id)).toEqual(['a', 'b'])
  })

  it('한 씬은 최대 8장이다 (9장이면 8장 + 1장)', () => {
    const photos = Array.from({ length: 9 }, (_, i) => photo(String(i)))
    const out = clusterPhotos(photos, [])
    expect(out.map((c) => c.length)).toEqual([8, 1])
  })

  it('1장짜리 씬은 앞 씬에 여유가 있으면 앞 씬에 병합된다', () => {
    const photos = [photo('1', '2025-02-03T10:00:00'), photo('2', '2025-02-03T10:10:00'), photo('3', '2025-02-03T20:00:00')]
    const out = clusterPhotos(photos, [])
    expect(out.map((c) => c.map((p) => p.id))).toEqual([['1', '2', '3']])
  })

  it('시각이 없으면 장면 유형이 바뀔 때(3장 이상 쌓인 뒤) 나눈다', () => {
    const photos = ['1', '2', '3', '4', '5', '6'].map((id) => photo(id))
    const analyses = ['1', '2', '3'].map((id) => analysis(id, '해변')).concat(['4', '5', '6'].map((id) => analysis(id, '카페')))
    expect(clusterPhotos(photos, analyses).map((c) => c.length)).toEqual([3, 3])
  })
})
