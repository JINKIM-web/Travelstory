import type { PhotoAnalysis, StoryProject, TravelPhoto, TravelScene, TravelStory } from '@/types'

export const project = (over: Partial<StoryProject> = {}): StoryProject => ({
  id: 'p1',
  title: '테스트 여행',
  destination: '제주',
  startDate: '2025-02-03',
  endDate: '2025-02-07',
  photoIds: [],
  sceneIds: [],
  pipeline: { analysis: 'idle', scenes: 'idle', story: 'idle' },
  createdAt: '2025-02-01T00:00:00.000Z',
  updatedAt: '2025-02-01T00:00:00.000Z',
  ...over,
})

export const photo = (id: string, capturedAt?: string, projectId = 'p1'): TravelPhoto => ({
  id,
  projectId,
  fileName: `${id}.jpg`,
  mimeType: 'image/jpeg',
  capturedAt,
})

export const analysis = (photoId: string, scene = '풍경', importanceScore = 5): PhotoAnalysis => ({
  id: `a-${photoId}`,
  projectId: 'p1',
  photoId,
  scene,
  objects: [],
  activities: [],
  description: '',
  importanceScore,
})

export const scene = (id: string, photoIds: string[], over: Partial<TravelScene> = {}): TravelScene => ({
  id,
  projectId: 'p1',
  title: `씬 ${id}`,
  photoIds,
  coverPhotoId: photoIds[0],
  order: 0,
  ...over,
})

export const story = (sceneIds: string[]): TravelStory => ({
  id: 's1',
  projectId: 'p1',
  title: '스토리 제목',
  summary: '요약 문장',
  introduction: '도입 문단',
  sections: sceneIds.map((sceneId) => ({ id: `sec-${sceneId}`, sceneId, heading: `챕터 ${sceneId}`, body: `본문 ${sceneId}` })),
  closing: '마무리',
  goldenQuote: '핵심 문장',
  tags: ['여행'],
  generatedAt: '2025-02-08T00:00:00.000Z',
  updatedAt: '2025-02-08T00:00:00.000Z',
})
