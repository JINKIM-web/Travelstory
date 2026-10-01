import type { PhotoAnalysis, StoryProject, TravelPhoto, TravelScene } from '@/types'
import { newId } from '@/utils/id'
import { chatJSON, hasOpenAI } from './client'

const GAP_MS = 150 * 60 * 1000
const MAX_PER_SCENE = 8

const dayOf = (iso: string) => iso.slice(0, 10)
const mostCommon = (xs: string[]) => {
  const m = new Map<string, number>()
  xs.forEach((x) => m.set(x, (m.get(x) ?? 0) + 1))
  return [...m.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
}

/** 촬영시각(없으면 업로드 순서) + 장면 유형으로 사진을 경험 단위로 묶는다. */
export function clusterPhotos(photos: TravelPhoto[], analyses: PhotoAnalysis[]): TravelPhoto[][] {
  const byPhoto = new Map(analyses.map((a) => [a.photoId, a]))
  const allTimed = photos.length > 0 && photos.every((p) => p.capturedAt)
  const sorted = allTimed ? [...photos].sort((a, b) => a.capturedAt!.localeCompare(b.capturedAt!)) : [...photos]

  const clusters: TravelPhoto[][] = []
  for (const p of sorted) {
    const cur = clusters[clusters.length - 1]
    const prev = cur?.[cur.length - 1]
    let split = !cur || cur.length >= MAX_PER_SCENE
    if (!split && prev) {
      if (allTimed) {
        const gap = new Date(p.capturedAt!).getTime() - new Date(prev.capturedAt!).getTime()
        split = gap > GAP_MS || dayOf(p.capturedAt!) !== dayOf(prev.capturedAt!)
      } else {
        const a = byPhoto.get(p.id)?.scene
        const b = byPhoto.get(prev.id)?.scene
        split = cur.length >= 3 && !!a && !!b && a !== b
      }
    }
    if (split) clusters.push([p])
    else cur.push(p)
  }
  // 1장짜리 씬은 앞 씬에 병합
  return clusters.reduce<TravelPhoto[][]>((acc, c) => {
    if (c.length === 1 && acc.length && acc[acc.length - 1].length < MAX_PER_SCENE) acc[acc.length - 1].push(...c)
    else acc.push(c)
    return acc
  }, [])
}

interface RawScene {
  title?: string
  location?: string | null
  keywords?: string[]
  description?: string
}

const SYSTEM = `당신은 여행 에디터입니다. 주어진 씬(사진 묶음)마다 제목과 키워드를 붙이세요.
- 입력의 사진 분석 결과에 있는 사실만 사용하고, 없는 장소명/사건을 만들지 마세요.
- title: 12~24자의 감성적이지만 사실에 근거한 한국어 제목.
- keywords: 2~3개 짧은 한국어 키워드(# 없이).
- description: 한 문장 요약.
JSON만 출력: {"scenes":[{"title":string,"location":string|null,"keywords":string[],"description":string}]} (입력 씬과 같은 개수, 같은 순서)`

export async function buildScenes(
  project: StoryProject,
  photos: TravelPhoto[],
  analyses: PhotoAnalysis[],
): Promise<TravelScene[]> {
  const byPhoto = new Map(analyses.map((a) => [a.photoId, a]))
  const clusters = clusterPhotos(photos, analyses)

  let named: RawScene[] = []
  if (hasOpenAI && clusters.length) {
    try {
      const input = clusters.map((c, i) => ({
        scene: i + 1,
        date: c[0].capturedAt,
        photos: c.map((p) => {
          const a = byPhoto.get(p.id)
          return { scene: a?.scene, location: a?.location, mood: a?.mood, description: a?.description }
        }),
      }))
      const res = await chatJSON<{ scenes: RawScene[] }>([
        { role: 'system', content: SYSTEM },
        { role: 'user', content: `여행지: ${project.destination ?? '미입력'}\n${JSON.stringify(input)}` },
      ])
      named = res.scenes ?? []
    } catch (e) {
      console.error('씬 이름 생성 실패, 기본 이름 사용', e)
    }
  }

  return clusters.map((c, i) => {
    const as = c.map((p) => byPhoto.get(p.id)).filter((a): a is PhotoAnalysis => !!a)
    const cover = [...as].sort((a, b) => b.importanceScore - a.importanceScore)[0]?.photoId ?? c[0].id
    const n = named[i]
    const label = mostCommon(as.map((a) => a.scene).filter((s) => s !== '여행 장면'))
    return {
      id: newId(),
      projectId: project.id,
      title: n?.title || (label ? `${label}의 시간` : `장면 ${i + 1}`),
      date: c[0].capturedAt?.slice(0, 10),
      location: n?.location ?? mostCommon(as.map((a) => a.location ?? '').filter(Boolean)) ?? undefined,
      keywords: n?.keywords?.slice(0, 3),
      description: n?.description,
      photoIds: c.map((p) => p.id),
      coverPhotoId: cover,
      order: i,
    }
  })
}
