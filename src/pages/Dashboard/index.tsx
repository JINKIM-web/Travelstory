import { useRef, useState } from 'react'
import { ArrowRight, Images, Plus, Sparkles, Upload, BookOpenText } from 'lucide-react'
import { Button, ConfirmDialog, LinkButton, Modal, Notice } from '@/components/common/ui'
import { LogoMark } from '@/components/common/Logo'
import ProjectCard from '@/components/dashboard/ProjectCard'
import ProjectInfoForm from '@/components/project/ProjectInfoForm'
import { useHeroBackground } from '@/hooks/useHeroBackground'
import { useProjectStore } from '@/stores/projectStore'
import { downloadBlob, exportProject, importBackup } from '@/services/backup'
import type { StoryProject } from '@/types'
import { cn } from '@/utils/cn'

const FILTERS = [
  { id: 'all', label: '전체' },
  { id: 'done', label: '스토리 완성' },
  { id: 'wip', label: '작성 중' },
] as const

export default function Dashboard() {
  const projects = useProjectStore((s) => s.projects)
  const updateProject = useProjectStore((s) => s.updateProject)
  const deleteProject = useProjectStore((s) => s.deleteProject)
  const importProject = useProjectStore((s) => s.importProject)
  const fileInput = useRef<HTMLInputElement>(null)
  const { bg, loaded } = useHeroBackground()
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('all')
  const [message, setMessage] = useState<{ tone: 'info' | 'error'; text: string }>()
  const [working, setWorking] = useState(false)
  const [editing, setEditing] = useState<StoryProject>()
  const [deleting, setDeleting] = useState<StoryProject>()

  const photoCount = projects.reduce((n, p) => n + p.photoIds.length, 0)
  const storyCount = projects.filter((p) => p.storyId).length
  const visible = [...projects]
    .filter((p) => (filter === 'all' ? true : filter === 'done' ? !!p.storyId : !p.storyId))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  const counts = { all: projects.length, done: storyCount, wip: projects.length - storyCount }

  const backup = async (p: StoryProject) => {
    setWorking(true)
    setMessage(undefined)
    try {
      downloadBlob(await exportProject(p), `${p.title}.travelcanvas.zip`)
      setMessage({ tone: 'info', text: `‘${p.title}’ 백업 파일을 저장했습니다.` })
    } catch (e) {
      setMessage({ tone: 'error', text: e instanceof Error ? `백업 실패: ${e.message}` : '백업 실패' })
    } finally {
      setWorking(false)
    }
  }

  const restore = async (file: File) => {
    setWorking(true)
    setMessage(undefined)
    try {
      const { project, data } = await importBackup(file)
      importProject(project, data)
      setMessage({ tone: 'info', text: `‘${project.title}’ 프로젝트를 복원했습니다 (사진 ${data.photos.length}장).` })
    } catch (e) {
      setMessage({ tone: 'error', text: e instanceof Error ? e.message : '복원 실패' })
    } finally {
      setWorking(false)
    }
  }

  const stats = [
    { icon: Images, label: '내 여행', value: projects.length, unit: '개' },
    { icon: Images, label: '여행 사진', value: photoCount, unit: '장' },
    { icon: BookOpenText, label: 'AI 스토리', value: storyCount, unit: '편' },
  ]

  return (
    <div>
      {/* ───── 히어로: Unsplash 풍경 배경 ───── */}
      <section className="relative isolate overflow-hidden text-white" aria-label="TravelCanvasAI 소개">
        {/* 키가 없거나 로딩 중일 때의 대체 배경 */}
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(135deg,#f6c9a8_0%,#d9694a_42%,#7a2e1d_100%)]" />
        {bg && (
          <img
            src={bg.url}
            alt=""
            className={cn('absolute inset-0 -z-10 h-full w-full object-cover', loaded && 'animate-fade-in')}
            fetchPriority="high"
          />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/70 via-black/25 to-black/40" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/45 via-transparent to-transparent" />

        <div className="mx-auto flex min-h-[540px] max-w-[1280px] flex-col justify-between gap-12 px-5 pb-8 pt-12 md:min-h-[600px] md:px-10 md:pt-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-3 rounded-full bg-white/15 py-1.5 pl-1.5 pr-4 text-sm font-semibold backdrop-blur-md ring-1 ring-white/25">
              <LogoMark className="h-8 w-8" />
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> AI 여행 스토리 스튜디오
              </span>
            </div>
            <h1 className="mt-6 text-[40px] font-extrabold leading-[1.15] tracking-tight drop-shadow-sm md:text-[60px]">
              지나간 여행을,
              <br />
              하나의 이야기로.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/90 md:text-xl">
              사진만 올리면 AI가 장면을 나누고, 에세이와 스토리 카드, 한 권의 스토리북까지 만들어 드려요.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <LinkButton to="/trips/new" size="lg" className="!bg-white !text-primary shadow-xl hover:!bg-white/90">
                <Plus className="h-5 w-5" /> 새 여행 시작하기
              </LinkButton>
              <a
                href="#my-trips"
                className="inline-flex min-h-[56px] items-center gap-2 rounded-full bg-white/15 px-7 text-base font-semibold text-white ring-1 ring-white/30 backdrop-blur-md transition hover:bg-white/25"
              >
                내 여행 보기 <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <dl className="grid w-full grid-cols-3 gap-3 sm:w-auto sm:min-w-[480px]">
              {stats.map((s) => (
                <div key={s.label} className="rounded-xl bg-white/15 px-4 py-3.5 ring-1 ring-white/25 backdrop-blur-md">
                  <dt className="flex items-center gap-1.5 text-[13px] font-medium text-white/85">
                    <s.icon className="h-3.5 w-3.5" /> {s.label}
                  </dt>
                  <dd className="mt-1 text-[26px] font-extrabold leading-none">
                    {s.value}
                    <span className="ml-1 text-sm font-semibold text-white/80">{s.unit}</span>
                  </dd>
                </div>
              ))}
            </dl>
            {bg && (
              <a href={bg.creditUrl} target="_blank" rel="noreferrer" className="text-xs text-white/80 underline-offset-2 hover:underline">
                {bg.credit}
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ───── 내 여행 ───── */}
      <section id="my-trips" className="relative -mt-7 rounded-t-[32px] bg-surface pt-10">
        <div className="mx-auto max-w-[1280px] px-5 pb-16 md:px-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-[28px] font-extrabold tracking-tight md:text-[32px]">내 여행</h2>
              <p className="mt-1 text-base text-on-surface-variant">사진과 문장으로 엮은 지난 여정들의 기록이에요.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-full bg-surface-container p-1" role="tablist" aria-label="프로젝트 필터">
                {FILTERS.map((f) => (
                  <button
                    key={f.id}
                    role="tab"
                    aria-selected={filter === f.id}
                    onClick={() => setFilter(f.id)}
                    className={cn(
                      'min-h-[40px] rounded-full px-4 text-[15px] font-semibold text-on-surface-variant transition',
                      filter === f.id && 'bg-surface-lowest text-on-surface shadow-card',
                    )}
                  >
                    {f.label} <span className="text-sm font-medium opacity-70">{counts[f.id]}</span>
                  </button>
                ))}
              </div>
              <Button variant="ghost" size="sm" loading={working} onClick={() => fileInput.current?.click()}>
                <Upload className="h-4 w-4" /> 백업 불러오기
              </Button>
              <input
                ref={fileInput}
                type="file"
                accept=".zip,application/zip"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) void restore(f)
                  e.target.value = ''
                }}
              />
            </div>
          </div>

          {message && (
            <div className="mt-5">
              <Notice tone={message.tone}>{message.text}</Notice>
            </div>
          )}

          {projects.length === 0 ? (
            <div className="mt-8 flex flex-col items-center rounded-xl border-2 border-dashed border-outline-variant bg-surface-lowest px-6 py-16 text-center">
              <LogoMark className="h-16 w-16" />
              <p className="mt-5 text-2xl font-extrabold">아직 기록된 여행이 없어요</p>
              <p className="mt-2 text-base text-on-surface-variant">첫 여행 사진을 올리면 AI가 이야기를 만들어 드려요.</p>
              <LinkButton to="/trips/new" size="lg" className="mt-6">
                <Plus className="h-5 w-5" /> 새 여행 시작하기
              </LinkButton>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((p) => (
                <ProjectCard key={p.id} project={p} onEdit={() => setEditing(p)} onDelete={() => setDeleting(p)} onBackup={() => void backup(p)} />
              ))}
              {visible.length === 0 && (
                <p className="col-span-full rounded-xl bg-surface-low p-10 text-center text-base text-on-surface-variant">해당하는 프로젝트가 없습니다.</p>
              )}
            </div>
          )}
        </div>
      </section>

      <Modal open={!!editing} onClose={() => setEditing(undefined)} title="여행 정보 수정">
        {editing && (
          <ProjectInfoForm
            initial={editing}
            submitLabel="저장"
            onCancel={() => setEditing(undefined)}
            onSubmit={(v) => {
              updateProject(editing.id, v)
              setEditing(undefined)
            }}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(undefined)}
        title="프로젝트를 삭제할까요?"
        confirmLabel="삭제"
        message={
          <>
            <b>{deleting?.title}</b>의 사진, 분석, 씬, 스토리, 스토리 카드가 모두 삭제되며 되돌릴 수 없습니다. 다른 프로젝트에는 영향이
            없습니다.
          </>
        }
        onConfirm={() => deleting && void deleteProject(deleting.id)}
      />
    </div>
  )
}
