/** AI 처리 4단계(분석 → 씬 → 스토리 → 카드)를 단계별로 실행하고 결과를 저장한다. */
import { useProjectStore } from '@/stores/projectStore'
import type { StepStatus, StoryCard, StoryStyle } from '@/types'
import { analyzePhotos, type AnalysisProgress } from '@/services/ai/photoAnalysis'
import { buildScenes } from '@/services/ai/sceneBuilder'
import { generateStory } from '@/services/ai/storyGenerator'
import { MOOD_GRADIENTS } from '@/services/unsplash'
import { newId, nowIso } from '@/utils/id'

const store = () => useProjectStore.getState()
const setStep = (id: string, step: 'analysis' | 'scenes' | 'story', status: StepStatus) => {
  const p = store().projects.find((x) => x.id === id)
  if (p) store().updateProject(id, { pipeline: { ...p.pipeline, [step]: status } })
}
const project = (id: string) => {
  const p = store().projects.find((x) => x.id === id)
  if (!p) throw new Error('프로젝트를 찾을 수 없습니다')
  return p
}
const data = (id: string) => store().data[id] ?? store().loadData(id)

/** 사진 분석 → 씬 구성. 분석에 실패한 사진이 있으면 거기서 멈추고, 재실행 시 실패분만 다시 분석한다. */
export async function runAnalysisAndScenes(
  projectId: string,
  onProgress?: (p: AnalysisProgress & { stage: 'analysis' | 'scenes' }) => void,
): Promise<{ failed: number }> {
  const { photos, analyses } = data(projectId)
  const have = new Set(analyses.map((a) => a.photoId))
  const todo = photos.filter((p) => !have.has(p.id))

  setStep(projectId, 'analysis', 'running')
  const { analyses: fresh, failedPhotoIds } = await analyzePhotos(project(projectId), todo, (p) =>
    onProgress?.({ ...p, stage: 'analysis' }),
  ).catch((e) => {
    setStep(projectId, 'analysis', 'error')
    throw e
  })
  const merged = [...analyses.filter((a) => photos.some((p) => p.id === a.photoId)), ...fresh]
  store().setAnalyses(projectId, merged)
  if (failedPhotoIds.length) {
    setStep(projectId, 'analysis', 'error')
    return { failed: failedPhotoIds.length }
  }
  setStep(projectId, 'analysis', 'done')

  setStep(projectId, 'scenes', 'running')
  onProgress?.({ stage: 'scenes', done: 0, total: 1 })
  try {
    const scenes = await buildScenes(project(projectId), photos, merged)
    store().setScenes(projectId, scenes)
    setStep(projectId, 'scenes', 'done')
  } catch (e) {
    setStep(projectId, 'scenes', 'error')
    throw e
  }
  onProgress?.({ stage: 'scenes', done: 1, total: 1 })
  return { failed: 0 }
}

export async function runStory(projectId: string, style: StoryStyle) {
  const p = project(projectId)
  const d = data(projectId)
  setStep(projectId, 'story', 'running')
  try {
    const story = await generateStory(p, d.scenes, d.analyses, d.memory, style, d.story?.id)
    store().setStory(projectId, story)
    store().updateProject(projectId, { storyStyle: style })

    // 카드는 최초 1회만 기본값으로 만들고, 이후 재생성에서는 사용자 편집을 보존한다.
    if (!d.card) {
      const best = [...d.analyses].sort((a, b) => b.importanceScore - a.importanceScore)[0]?.photoId
      const card: StoryCard = {
        id: newId(),
        projectId,
        template: 'editorial',
        coverPhotoId: d.scenes[0]?.coverPhotoId ?? best ?? d.photos[0]?.id,
        title: story.title,
        quote: story.goldenQuote ?? story.summary,
        backgroundUrl: MOOD_GRADIENTS[0].value,
        updatedAt: nowIso(),
      }
      store().setCard(projectId, card)
    }
    setStep(projectId, 'story', 'done')
  } catch (e) {
    setStep(projectId, 'story', 'error')
    throw e
  }
}
