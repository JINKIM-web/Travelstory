import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Pencil, RefreshCw, Save, ShieldCheck, Sparkles } from 'lucide-react'
import { Button, ConfirmDialog, LinkButton, Modal, Notice, PhotoImg, inputClass } from '@/components/common/ui'
import StoryCardPreview from '@/components/story-card/StoryCardPreview'
import { hasOpenAI } from '@/services/ai/client'
import { regenerateSection, verifyStory } from '@/services/ai/storyGenerator'
import { runStory } from '@/services/pipeline'
import { useProject, useProjectData, useProjectStore } from '@/stores/projectStore'
import type { TravelStory } from '@/types'
import { formatSceneDate } from '@/utils/date'
import { nowIso } from '@/utils/id'

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV']

export default function Story() {
  const { projectId = '' } = useParams()
  const project = useProject(projectId)
  const data = useProjectData(projectId)
  const setStory = useProjectStore((s) => s.setStory)
  const [draft, setDraft] = useState<TravelStory>()
  const [regen, setRegen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [sectionBusy, setSectionBusy] = useState<string>()
  const [verifying, setVerifying] = useState(false)
  const [issues, setIssues] = useState<Record<string, string[]>>()
  const [lightbox, setLightbox] = useState<string>()
  const [error, setError] = useState<string>()

  const story = data.story
  if (!project) return null
  if (!story) {
    return (
      <div className="rounded-lg bg-surface-low p-10 text-center">
        <p className="text-xl font-bold">아직 생성된 스토리가 없어요</p>
        <p className="mt-2 text-sm text-on-surface-variant">사진 분석과 씬 구성을 마친 뒤 AI 스토리를 생성해 보세요.</p>
        <LinkButton to={`/trips/${projectId}/build?step=${data.scenes.length ? 3 : 2}`} className="mt-5">
          {data.scenes.length ? '스토리 만들기' : '사진 올리고 시작하기'}
        </LinkButton>
      </div>
    )
  }

  const editing = !!draft
  const view = draft ?? story
  const style = project.storyStyle ?? 'emotional'
  const patch = (p: Partial<TravelStory>) => setDraft({ ...view, ...p })
  const patchSection = (id: string, p: { heading?: string; body?: string }) =>
    patch({ sections: view.sections.map((s) => (s.id === id ? { ...s, ...p } : s)) })

  const regenerate = async () => {
    setBusy(true)
    setError(undefined)
    try {
      await runStory(projectId, style)
      setDraft(undefined)
      setIssues(undefined)
    } catch (e) {
      setError(e instanceof Error ? e.message : '스토리 생성 실패')
    } finally {
      setBusy(false)
    }
  }

  const rewriteSection = async (sectionId: string) => {
    const sec = story.sections.find((s) => s.id === sectionId)
    const scene = data.scenes.find((s) => s.id === sec?.sceneId)
    if (!sec || !scene) return
    setSectionBusy(sectionId)
    setError(undefined)
    try {
      const r = await regenerateSection(project, scene, data.analyses, data.memory, style, { heading: sec.heading, body: sec.body })
      setStory(projectId, {
        ...story,
        sections: story.sections.map((s) => (s.id === sectionId ? { ...s, ...r } : s)),
        updatedAt: nowIso(),
      })
      setIssues((cur) => (cur ? { ...cur, [sectionId]: [] } : cur))
    } catch (e) {
      setError(e instanceof Error ? e.message : '챕터 재생성 실패')
    } finally {
      setSectionBusy(undefined)
    }
  }

  const verify = async () => {
    setVerifying(true)
    setError(undefined)
    try {
      setIssues(await verifyStory(story, data.scenes, data.analyses, data.memory))
    } catch (e) {
      setError(e instanceof Error ? e.message : '사실 점검 실패')
    } finally {
      setVerifying(false)
    }
  }
  const issueCount = issues ? Object.values(issues).reduce((n, l) => n + l.length, 0) : 0

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <article className="min-w-0 max-w-3xl">
        <div className="mb-6 flex flex-wrap gap-2">
          {editing ? (
            <>
              <Button
                onClick={() => {
                  setStory(projectId, { ...view, updatedAt: nowIso() })
                  setDraft(undefined)
                }}
              >
                <Save className="h-4 w-4" /> 저장
              </Button>
              <Button variant="ghost" onClick={() => setDraft(undefined)}>
                취소
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setDraft(story)}>
                <Pencil className="h-4 w-4" /> 이야기 문장 수정
              </Button>
              <Button variant="ghost" loading={busy} onClick={() => setRegen(true)}>
                <RefreshCw className="h-4 w-4" /> AI로 다시 쓰기
              </Button>
              <Button variant="ghost" loading={verifying} disabled={!hasOpenAI} onClick={() => void verify()} title={hasOpenAI ? '' : 'OpenAI 키가 필요합니다'}>
                <ShieldCheck className="h-4 w-4" /> 사실 점검
              </Button>
            </>
          )}
        </div>
        {error && <Notice tone="error">{error}</Notice>}
        {issues && !editing && (
          <div className="mb-4">
            {issueCount === 0 ? (
              <Notice>사실 점검 결과, 사진 분석에 근거하지 않는 문장이 발견되지 않았습니다.</Notice>
            ) : (
              <Notice>사실 점검 결과 {issueCount}건의 확인이 필요한 문장이 있습니다. 해당 챕터 아래를 확인하세요.</Notice>
            )}
          </div>
        )}

        {editing ? (
          <>
            <input aria-label="스토리 제목" className={`${inputClass} font-serif text-2xl font-semibold`} value={view.title} onChange={(e) => patch({ title: e.target.value })} />
            {view.titleCandidates && view.titleCandidates.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1 text-xs text-on-surface-variant">
                  <Sparkles className="h-3.5 w-3.5" /> AI 제목 제안
                </span>
                {view.titleCandidates.map((t) => (
                  <button key={t} onClick={() => patch({ title: t })} className="rounded-full border border-outline-variant px-3 py-1 text-xs hover:bg-surface-container">
                    {t}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <h2 className="font-serif text-[32px] font-bold leading-tight md:text-[44px]">{story.title}</h2>
        )}

        <div className="mt-6 rounded-xl border-l-4 border-primary bg-surface-lowest p-6 shadow-card">
          <p className="label-caps text-primary">AI 감성 큐레이션 요약</p>
          {editing ? (
            <textarea aria-label="요약" className={`${inputClass} mt-2 min-h-20 font-serif italic`} value={view.summary} onChange={(e) => patch({ summary: e.target.value })} />
          ) : (
            <p className="mt-2 font-serif text-xl italic leading-relaxed">“{story.summary}”</p>
          )}
        </div>

        {(view.introduction || editing) &&
          (editing ? (
            <textarea aria-label="도입" className={`${inputClass} mt-6 min-h-24`} value={view.introduction ?? ''} onChange={(e) => patch({ introduction: e.target.value })} />
          ) : (
            <p className="mt-6 whitespace-pre-line text-[17px] leading-[1.95]">{story.introduction}</p>
          ))}

        {view.sections.map((sec, i) => {
          const scene = data.scenes.find((s) => s.id === sec.sceneId)
          const photos = scene?.photoIds.slice(0, 4) ?? []
          const secIssues = issues?.[sec.id] ?? []
          return (
            <section key={sec.id} id={`sec-${sec.id}`} className="mt-12 scroll-mt-24">
              <div className="flex items-center justify-between gap-2">
                <p className="label-caps text-on-surface-variant">
                  Chapter {ROMAN[i] ?? i + 1}
                  {scene?.date && ` · ${formatSceneDate(scene.date)}`}
                  {scene?.location && ` · ${scene.location}`}
                </p>
                {!editing && scene && (
                  <button
                    onClick={() => void rewriteSection(sec.id)}
                    disabled={sectionBusy === sec.id}
                    className="flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3 w-3 ${sectionBusy === sec.id ? 'animate-spin' : ''}`} />
                    이 챕터 다시 쓰기
                  </button>
                )}
              </div>
              {editing ? (
                <input aria-label="챕터 제목" className={`${inputClass} mt-2 font-serif text-xl font-semibold`} value={sec.heading} onChange={(e) => patchSection(sec.id, { heading: e.target.value })} />
              ) : (
                <h3 className="mt-2 font-serif text-[26px] font-bold leading-snug">{sec.heading}</h3>
              )}
              {editing ? (
                <textarea aria-label="본문" className={`${inputClass} mt-3 min-h-32`} value={sec.body} onChange={(e) => patchSection(sec.id, { body: e.target.value })} />
              ) : (
                <p className="mt-4 whitespace-pre-line text-[17px] leading-[1.95]">{sec.body}</p>
              )}
              {secIssues.length > 0 && !editing && (
                <div className="mt-3 rounded-md bg-tertiary-fixed p-3 text-sm text-tertiary">
                  <p className="font-medium">사진 분석으로 확인되지 않는 내용</p>
                  <ul className="mt-1 list-disc pl-5">
                    {secIssues.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </div>
              )}
              {photos.length > 0 && (
                <div className={`mt-4 grid gap-3 ${photos.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  {photos.map((id) => (
                    <button key={id} onClick={() => setLightbox(id)} aria-label="사진 크게 보기" className="overflow-hidden rounded-md">
                      <PhotoImg photoId={id} kind={photos.length === 1 ? 'original' : 'thumb'} className="aspect-[4/3] w-full transition hover:scale-[1.02]" />
                    </button>
                  ))}
                </div>
              )}
            </section>
          )
        })}

        {(view.closing || editing) && (
          <section className="mt-12 rounded-lg bg-surface-low p-6">
            <p className="text-lg font-bold">기록의 마침표</p>
            {editing ? (
              <textarea aria-label="마무리" className={`${inputClass} mt-2 min-h-20`} value={view.closing ?? ''} onChange={(e) => patch({ closing: e.target.value })} />
            ) : (
              <p className="mt-2 whitespace-pre-line text-[17px] leading-[1.95]">{story.closing}</p>
            )}
          </section>
        )}
        {editing && (
          <label className="mt-6 block">
            <span className="label-caps text-on-surface-variant">스토리 카드 핵심 문장</span>
            <input className={`${inputClass} mt-1`} value={view.goldenQuote ?? ''} onChange={(e) => patch({ goldenQuote: e.target.value })} />
          </label>
        )}
      </article>

      <aside className="space-y-5 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto">
        <div className="rounded-xl bg-surface-lowest p-5 shadow-card">
          <p className="mb-3 text-lg font-bold">AI 스토리 카드</p>
          {data.card ? (
            <>
              <div className="flex justify-center overflow-hidden">
                <div style={{ zoom: 0.9 }}>
                  <StoryCardPreview card={data.card} project={project} />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <LinkButton to={`/trips/${projectId}/story-card`}>카드 꾸미기</LinkButton>
                <LinkButton to={`/trips/${projectId}/storybook`} variant="secondary">
                  스토리북 만들기
                </LinkButton>
              </div>
            </>
          ) : (
            <p className="text-sm text-on-surface-variant">
              <Link to={`/trips/${projectId}/story-card`} className="text-primary underline">
                스토리 카드
              </Link>
              를 만들어 보세요.
            </p>
          )}
        </div>

        <div className="rounded-xl bg-surface-lowest p-5 shadow-card">
          <p className="mb-3 flex items-center justify-between text-lg font-bold">
            AI 씬 요약
            <span className="rounded-full bg-surface-container px-2 py-0.5 text-xs font-medium">{view.sections.length} SCENES</span>
          </p>
          <ul className="space-y-2">
            {view.sections.map((sec, i) => {
              const scene = data.scenes.find((s) => s.id === sec.sceneId)
              return (
                <li key={sec.id}>
                  <a
                    href={`#sec-${sec.id}`}
                    onClick={(e) => {
                      e.preventDefault()
                      document.getElementById(`sec-${sec.id}`)?.scrollIntoView({ behavior: 'smooth' })
                    }}
                    className="flex items-center gap-3 rounded-md p-1.5 hover:bg-surface-low"
                  >
                    <PhotoImg photoId={scene?.coverPhotoId} className="h-12 w-12 shrink-0 rounded-md" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[11px] text-on-surface-variant">
                        SCENE {String(i + 1).padStart(2, '0')}
                        {scene?.date && ` · ${formatSceneDate(scene.date)}`}
                      </span>
                      <span className="block truncate text-sm font-medium">{sec.heading}</span>
                    </span>
                    <span className="text-xs text-on-surface-variant">{scene?.photoIds.length ?? 0}장</span>
                  </a>
                </li>
              )
            })}
          </ul>
        </div>
      </aside>

      <Modal open={!!lightbox} onClose={() => setLightbox(undefined)} title="사진 보기">
        {lightbox && <PhotoImg photoId={lightbox} kind="original" className="max-h-[70vh] w-full rounded-md object-contain" />}
      </Modal>
      <ConfirmDialog
        open={regen}
        onClose={() => setRegen(false)}
        title="AI로 다시 쓸까요?"
        confirmLabel="다시 쓰기"
        message="직접 수정한 스토리 문장은 새로 생성한 결과로 덮어써집니다. 스토리 카드와 스토리북 설정은 유지됩니다."
        onConfirm={() => void regenerate()}
      />
    </div>
  )
}
