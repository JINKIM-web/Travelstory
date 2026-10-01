import type { PhotoAnalysis, StoryProject, TravelPhoto } from '@/types'
import { getPhoto } from '@/services/storage/indexedDB'
import { blobToDataUrl, resizeToBlob } from '@/services/image'
import { newId } from '@/utils/id'
import { chatJSON, hasOpenAI, type ChatMessage } from './client'

const BATCH = 4
const CONCURRENCY = 2

const SYSTEM = `당신은 여행 사진 분석가입니다. 각 사진에서 "눈에 보이는 것"만 근거로 분석하세요.
- 사진으로 확인할 수 없는 사실(정확한 지명, 인물 관계, 날짜, 날씨 수치 등)은 추측하지 마세요. location은 랜드마크처럼 확실할 때만 쓰고 아니면 null.
- 여행 정보(제목/여행지)는 참고용 힌트이며 사진과 모순되면 사진을 따르세요.
- 모든 텍스트는 한국어.
JSON만 출력: {"results":[{"index":number,"location":string|null,"scene":string(짧은 장면 유형: 해변/카페/식사/골목/숙소/풍경 등),"objects":string[],"activities":string[],"mood":string|null,"description":string(사실 기반 한 문장),"importanceScore":1~10 정수(여행을 대표할 정도),"confidence":0~1}]}`

interface RawResult {
  index: number
  location?: string | null
  scene?: string
  objects?: string[]
  activities?: string[]
  mood?: string | null
  description?: string
  importanceScore?: number
  confidence?: number
}

export interface AnalysisProgress {
  done: number
  total: number
}

export interface AnalysisOutcome {
  analyses: PhotoAnalysis[]
  failedPhotoIds: string[]
}

/** 데모 모드: 사진 내용을 알 수 없으므로 내용 단정 없이 중립적인 결과만 만든다. */
function mockAnalysis(project: StoryProject, photo: TravelPhoto, i: number): PhotoAnalysis {
  let h = 0
  for (const c of photo.id) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return {
    id: newId(),
    projectId: project.id,
    photoId: photo.id,
    location: project.destination,
    scene: '여행 장면',
    objects: [],
    activities: [],
    description: `${i + 1}번째 사진 (데모 모드: AI 키가 없어 내용을 분석하지 않았습니다)`,
    importanceScore: 3 + (h % 6),
    confidence: 0,
  }
}

async function analyzeBatch(project: StoryProject, batch: TravelPhoto[]): Promise<PhotoAnalysis[]> {
  const imgs = await Promise.all(
    batch.map(async (p) => {
      const rec = await getPhoto(p.id)
      if (!rec) throw new Error('사진 데이터를 찾을 수 없습니다')
      const { blob } = await resizeToBlob(rec.original, 768, 0.8)
      return blobToDataUrl(blob)
    }),
  )
  const hint = `여행 제목: ${project.title}\n여행지: ${project.destination ?? '미입력'}\n사진 ${batch.length}장을 index 0부터 순서대로 분석하세요.`
  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM },
    {
      role: 'user',
      content: [
        { type: 'text', text: hint },
        ...imgs.map((url) => ({ type: 'image_url' as const, image_url: { url, detail: 'low' as const } })),
      ],
    },
  ]
  const { results } = await chatJSON<{ results: RawResult[] }>(messages)
  return batch.flatMap((photo, i) => {
    const r = results.find((x) => x.index === i)
    if (!r) return []
    return [
      {
        id: newId(),
        projectId: project.id,
        photoId: photo.id,
        location: r.location ?? undefined,
        scene: r.scene || '여행 장면',
        objects: r.objects ?? [],
        activities: r.activities ?? [],
        mood: r.mood ?? undefined,
        description: r.description ?? '',
        importanceScore: Math.min(10, Math.max(1, Math.round(r.importanceScore ?? 5))),
        confidence: r.confidence,
      },
    ]
  })
}

export async function analyzePhotos(
  project: StoryProject,
  photos: TravelPhoto[],
  onProgress?: (p: AnalysisProgress) => void,
): Promise<AnalysisOutcome> {
  const analyses: PhotoAnalysis[] = []
  const failedPhotoIds: string[] = []
  let done = 0
  onProgress?.({ done, total: photos.length })

  if (!hasOpenAI) {
    photos.forEach((p, i) => analyses.push(mockAnalysis(project, p, i)))
    onProgress?.({ done: photos.length, total: photos.length })
    return { analyses, failedPhotoIds }
  }

  const batches: TravelPhoto[][] = []
  for (let i = 0; i < photos.length; i += BATCH) batches.push(photos.slice(i, i + BATCH))
  let cursor = 0
  const worker = async () => {
    while (cursor < batches.length) {
      const batch = batches[cursor++]
      try {
        const got = await analyzeBatch(project, batch)
        analyses.push(...got)
        const gotIds = new Set(got.map((a) => a.photoId))
        failedPhotoIds.push(...batch.filter((p) => !gotIds.has(p.id)).map((p) => p.id))
      } catch (e) {
        console.error('사진 분석 실패', e)
        failedPhotoIds.push(...batch.map((p) => p.id))
      }
      done += batch.length
      onProgress?.({ done, total: photos.length })
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker))
  return { analyses, failedPhotoIds }
}
