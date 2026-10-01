import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Pencil, Plus, Sparkles } from 'lucide-react'
import { Button, ConfirmDialog, Notice, ProgressBar, inputClass } from '@/components/common/ui'
import PhotoDropzone from '@/components/photo/PhotoDropzone'
import ProjectInfoForm from '@/components/project/ProjectInfoForm'
import ProjectStepper, { type StepKey } from '@/components/project/ProjectStepper'
import SceneCard from '@/components/project/SceneCard'
import { hasOpenAI } from '@/services/ai/client'
import { MEMORY_QUESTIONS, STORY_STYLES } from '@/services/ai/storyGenerator'
import { runAnalysisAndScenes, runStory } from '@/services/pipeline'
import { useProject, useProjectData, useProjectStore } from '@/stores/projectStore'
import type { MemoryAnswer, StoryStyle } from '@/types'
import { cn } from '@/utils/cn'
import { formatRange } from '@/utils/date'
import { addScene, deleteScene, moveScene, movePhoto, updateScene } from '@/utils/sceneOps'

const STEPS = ['여행 정보', '사진 업로드 & AI 분석', '여행 기억 문답', '감성 스토리 생성']

export default function NewProject() {
  const { projectId } = useParams()
  const [search, setSearch] = useSearchParams()
  const navigate = useNavigate()
  const project = useProject(projectId)
  const data = useProjectData(projectId)
  const store = useProjectStore()

  const step = projectId ? Math.min(4, Math.max(1, Number(search.get('step')) || 2)) : 1
  const goStep = (n: number, id = projectId) => navigate(`/trips/${id}/build?step=${n}`, { replace: n === 1 && !id })

  const [progress, setProgress] = useState<{ label: string; value: number }>()
  const [error, setError] = useState<string>()
  const [confirmRebuild, setConfirmRebuild] = useState(false)
  const [style, setStyle] = useState<StoryStyle>(project?.storyStyle ?? 'emotional')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const answerOf = (id: string) => answers[id] ?? data.memory.find((m) => m.questionId === id)?.answer ?? ''

  if (projectId && !project) {
    return (
      <div className="py-20 text-center">
        <p className="text-xl font-bold">프로젝트를 찾을 수 없습니다.</p>
        <Link to="/trips" className="mt-4 inline-block text-primary underline">
          목록으로
        </Link>
      </div>
    )
  }

  const unassigned = data.photos.filter((p) => !data.scenes.some((s) => s.photoIds.includes(p.id)))
  const busy = !!progress

  const analyze = async () => {
    if (!projectId) return
    setError(undefined)
    setProgress({ label: '사진 분석 준비 중…', value: 0 })
    try {
      const { failed } = await runAnalysisAndScenes(projectId, (p) =>
        setProgress({
          label: p.stage === 'analysis' ? `사진 분석 중 ${p.done}/${p.total}` : '씬 구성 중…',
          value: p.stage === 'analysis' ? (p.done / p.total) * 0.9 : 0.95,
        }),
      )
      if (failed) setError(`${failed}장의 사진 분석에 실패했습니다. 다시 시도하면 실패한 사진만 재분석합니다.`)
    } catch (e) {
      setError(e instanceof Error ? e.message : '분석 중 오류가 발생했습니다.')
    } finally {
      setProgress(undefined)
    }
  }

  const finish = async () => {
    if (!projectId) return
    const memory: MemoryAnswer[] = MEMORY_QUESTIONS.map((q) => ({ questionId: q.id, question: q.question, answer: answerOf(q.id) }))
    store.setMemory(projectId, memory)
    setError(undefined)
    setProgress({ label: 'AI가 여행 이야기를 쓰는 중…', value: 0.5 })
    try {
      await runStory(projectId, style)
      navigate(`/trips/${projectId}/story`)
    } catch (e) {
      setError(e instanceof Error ? e.message : '스토리 생성 중 오류가 발생했습니다.')
    } finally {
      setProgress(undefined)
    }
  }

  const setScenes = (v: typeof data.scenes) => projectId && store.setScenes(projectId, v)

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[244px_minmax(0,1fr)] lg:gap-8">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <ProjectStepper projectId={projectId} current={step as StepKey} />
      </aside>

      <div className="min-w-0 space-y-6">
      <div className="flex flex-wrap items-center gap-4 rounded-xl bg-surface-lowest p-4 shadow-card md:p-5">
        <span className="rounded-full bg-primary-fixed px-3 py-1 label-caps text-primary">Step {String(step).padStart(2, '0')}</span>
        <h1 className="text-xl font-extrabold">{STEPS[step - 1]}</h1>
      </div>

      {!hasOpenAI && step >= 2 && (
        <Notice>
          데모 모드: <code>.env.local</code>에 <code>OPENAI_API_KEY</code>가 없어 AI가 사진 내용을 분석하지 않습니다. 씬 구성과 스토리는 입력값 기반의 기본 문구로 채워집니다.
        </Notice>
      )}
      {error && <Notice tone="error">{error}</Notice>}

      {step === 1 && (
        <section className="mx-auto max-w-xl rounded-xl bg-surface-lowest p-6 shadow-card md:p-8">
          <ProjectInfoForm
            initial={project}
            submitLabel="다음: 사진 업로드"
            onSubmit={(v) => {
              if (project) {
                store.updateProject(project.id, v)
                goStep(2)
              } else {
                const p = store.createProject(v)
                goStep(2, p.id)
              }
            }}
          />
        </section>
      )}

      {step === 2 && project && (
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-xl bg-surface-lowest p-5 shadow-card">
              <div className="flex items-center justify-between">
                <p className="label-caps text-on-surface-variant">Archive profile</p>
                <button onClick={() => setSearch({ step: '1' })} className="flex items-center gap-1 text-xs text-primary">
                  <Pencil className="h-3 w-3" /> 정보 수정
                </button>
              </div>
              <h2 className="mt-3 text-2xl font-extrabold leading-snug">{project.title}</h2>
              <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-md bg-surface-low p-3">
                  <dt className="text-xs text-on-surface-variant">여행지</dt>
                  <dd className="mt-0.5 font-medium">{project.destination || '-'}</dd>
                </div>
                <div className="rounded-md bg-surface-low p-3">
                  <dt className="text-xs text-on-surface-variant">여정 기간</dt>
                  <dd className="mt-0.5 font-medium">{formatRange(project.startDate, project.endDate) || '-'}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-xl bg-surface-lowest p-5 shadow-card">
              <p className="flex items-center gap-2 font-medium">
                <Sparkles className="h-4 w-4 text-primary" /> 분석 현황
              </p>
              <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                {[
                  ['사진', data.photos.length],
                  ['분석 완료', data.analyses.length],
                  ['씬', data.scenes.length],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-md bg-surface-lowest p-3">
                    <dt className="text-xs text-on-surface-variant">{k}</dt>
                    <dd className="text-2xl font-extrabold">{v}</dd>
                  </div>
                ))}
              </dl>
              {busy && <div className="mt-4"><ProgressBar value={progress.value} label={progress.label} /></div>}
              <Button
                className="mt-4 w-full"
                disabled={!data.photos.length || busy}
                loading={busy}
                onClick={() => (data.scenes.length ? setConfirmRebuild(true) : void analyze())}
              >
                {data.scenes.length ? 'AI 분석 & 씬 다시 구성' : 'AI 사진 분석 & 씬 구성'}
              </Button>
            </div>

            <Button size="lg" className="w-full" disabled={!data.scenes.length || busy} onClick={() => goStep(3)}>
              다음: 기억 보완 질문
            </Button>
          </aside>

          <section className="min-w-0 space-y-5">
            <PhotoDropzone projectId={project.id} compact={data.photos.length > 0} />
            {unassigned.length > 0 && data.scenes.length > 0 && (
              <Notice>씬에 포함되지 않은 사진이 {unassigned.length}장 있습니다. &lsquo;AI 분석 &amp; 씬 다시 구성&rsquo;을 눌러 반영하세요.</Notice>
            )}

            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-extrabold">자동 구조화된 씬</h2>
              {data.scenes.length > 0 && (
                <span className="rounded-full bg-primary-fixed px-2.5 py-1 label-caps text-primary">{data.scenes.length} scenes</span>
              )}
              {data.scenes.length > 0 && <span className="ml-auto text-xs text-on-surface-variant">사진을 끌어서 순서를 바꿀 수 있어요</span>}
            </div>

            {data.scenes.length === 0 ? (
              <p className="rounded-lg bg-surface-low p-8 text-center text-sm text-on-surface-variant">
                사진을 올리고 &lsquo;AI 사진 분석 &amp; 씬 구성&rsquo;을 누르면 여행의 장면이 자동으로 만들어집니다.
              </p>
            ) : (
              data.scenes.map((s, i) => (
                <SceneCard
                  key={s.id}
                  scene={s}
                  index={i}
                  total={data.scenes.length}
                  allScenes={data.scenes}
                  onChange={(patch) => setScenes(updateScene(data.scenes, s.id, patch))}
                  onMove={(dir) => setScenes(moveScene(data.scenes, s.id, dir))}
                  onDelete={() => setScenes(deleteScene(data.scenes, s.id))}
                  onSetCover={(photoId) => setScenes(updateScene(data.scenes, s.id, { coverPhotoId: photoId }))}
                  onRemovePhoto={(photoId) => void store.removePhoto(project.id, photoId)}
                  onMovePhoto={(photoId, to) => setScenes(movePhoto(data.scenes, photoId, to))}
                  onReorderPhotos={(photoIds) => setScenes(updateScene(data.scenes, s.id, { photoIds }))}
                />
              ))
            )}
            {data.scenes.length > 0 && (
              <Button variant="secondary" className="w-full" onClick={() => setScenes(addScene(data.scenes, project.id))}>
                <Plus className="h-4 w-4" /> 새 여행 씬(Scene) 수동 생성하기
              </Button>
            )}
          </section>
        </div>
      )}

      {step === 3 && project && (
        <section className="mx-auto max-w-2xl space-y-5 rounded-xl bg-surface-lowest p-6 shadow-card md:p-8">
          <div>
            <p className="label-caps text-on-surface-variant">Deep memory inquiry</p>
            <h2 className="mt-1 text-2xl font-extrabold">당신의 기억을 더해 문장을 피워냅니다</h2>
            <p className="mt-1 text-sm text-on-surface-variant">사진만으로는 알 수 없는 마음을 적어 주세요. 비워 둬도 괜찮고, 적은 내용은 AI가 우선해서 반영합니다.</p>
          </div>
          {MEMORY_QUESTIONS.map((q, i) => (
            <label key={q.id} className="block">
              <span className="flex items-center justify-between text-sm font-medium">
                Q{i + 1}. {q.question}
                <span className="text-xs font-normal text-primary">{q.hint}</span>
              </span>
              <textarea
                className={`${inputClass} mt-2 min-h-20`}
                value={answerOf(q.id)}
                onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
              />
            </label>
          ))}
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => goStep(2)}>
              이전
            </Button>
            <Button
              onClick={() => {
                store.setMemory(project.id, MEMORY_QUESTIONS.map((q) => ({ questionId: q.id, question: q.question, answer: answerOf(q.id) })))
                goStep(4)
              }}
            >
              다음: 스토리 생성
            </Button>
          </div>
        </section>
      )}

      {step === 4 && project && (
        <section className="mx-auto max-w-2xl space-y-6 rounded-xl bg-surface-lowest p-6 shadow-card md:p-8">
          <div>
            <h2 className="text-2xl font-extrabold">AI 여행 스토리 생성</h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              {data.photos.length}장의 사진 · {data.scenes.length}개의 씬을 바탕으로 하나의 에세이를 씁니다.
            </p>
          </div>
          <fieldset>
            <legend className="label-caps mb-2 text-on-surface-variant">문체 선택</legend>
            <div className="grid gap-3 sm:grid-cols-3">
              {STORY_STYLES.map((s) => (
                <label
                  key={s.id}
                  className={cn('cursor-pointer rounded-md border p-3 text-sm', style === s.id ? 'border-primary bg-primary-fixed/40' : 'border-outline-variant')}
                >
                  <input type="radio" name="style" className="sr-only" checked={style === s.id} onChange={() => setStyle(s.id)} />
                  <b className="block">{s.label}</b>
                  <span className="text-xs text-on-surface-variant">{s.desc}</span>
                </label>
              ))}
            </div>
          </fieldset>
          {busy && <ProgressBar value={progress.value} label={progress.label} />}
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => goStep(3)} disabled={busy}>
              이전
            </Button>
            <Button size="lg" onClick={() => void finish()} loading={busy}>
              AI 여행 스토리 생성하기 ✨
            </Button>
          </div>
        </section>
      )}

      <ConfirmDialog
        open={confirmRebuild}
        onClose={() => setConfirmRebuild(false)}
        title="씬을 다시 구성할까요?"
        confirmLabel="다시 구성"
        message="직접 수정한 씬 제목, 사진 이동 내용이 AI 구성 결과로 덮어써집니다."
        onConfirm={() => void analyze()}
      />
      </div>
    </div>
  )
}
