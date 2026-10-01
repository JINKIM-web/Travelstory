import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { BookOpen, Copy, Download, FileText, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { Button, ConfirmDialog, LinkButton, Notice, inputClass } from '@/components/common/ui'
import ScaledPage from '@/components/common/ScaledPage'
import { SortableList } from '@/components/common/Sortable'
import BookPageView from '@/components/storybook/BookPageView'
import BookViewer from '@/components/storybook/BookViewer'
import PageEditor from '@/components/storybook/PageEditor'
import PrintRoot, { printWhenReady } from '@/components/storybook/PrintRoot'
import { PAGE_SIZE, buildStorybook, chapterNumbers, newPage } from '@/services/storybook/build'
import { exportNode } from '@/services/image/export'
import { useProject, useProjectData, useProjectStore } from '@/stores/projectStore'
import type { BookPage, BookPageKind, BookSize, BookTheme, Storybook } from '@/types/storybook'
import { cn } from '@/utils/cn'
import { newId, nowIso } from '@/utils/id'

const THEMES: { id: BookTheme; label: string }[] = [
  { id: 'editorial', label: 'Editorial' },
  { id: 'polaroid', label: 'Film Polaroid' },
  { id: 'minimal', label: 'Minimal' },
]
const KIND_LABEL: Record<BookPageKind, string> = {
  cover: '표지',
  intro: '프롤로그',
  chapter: '챕터',
  quote: '인용',
  closing: '에필로그',
  back: '뒷표지',
}
const ADDABLE: BookPageKind[] = ['chapter', 'quote', 'intro', 'closing']

const summary = (p: BookPage) =>
  p.kind === 'cover' ? p.title : p.kind === 'chapter' ? p.heading : p.kind === 'quote' ? p.text : p.kind === 'intro' ? p.body : p.kind === 'closing' ? p.body : ''

export default function StorybookPage() {
  const { projectId = '' } = useParams()
  const project = useProject(projectId)
  const data = useProjectData(projectId)
  const setStorybook = useProjectStore((s) => s.setStorybook)
  const { story, scenes, card, storybook: book } = data

  const [selId, setSelId] = useState<string>()
  const [viewing, setViewing] = useState(false)
  const [printing, setPrinting] = useState(false)
  const [rebuild, setRebuild] = useState(false)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string>()
  const pageRef = useRef<HTMLDivElement>(null)

  // 스토리가 있고 스토리북이 없으면 자동 구성(AI 호출 없음)
  useEffect(() => {
    if (project && story && !book) setStorybook(projectId, buildStorybook({ project, story, scenes, card, photos: data.photos, analyses: data.analyses }))
  }, [project, story, book, scenes, card, data.photos, data.analyses, projectId, setStorybook])

  const nums = useMemo(() => chapterNumbers(book?.pages ?? []), [book?.pages])

  if (!project) return null
  if (!story) {
    return (
      <div className="rounded-lg bg-surface-low p-10 text-center">
        <p className="text-xl font-bold">스토리를 먼저 생성해 주세요</p>
        <p className="mt-2 text-sm text-on-surface-variant">스토리북은 만들어진 스토리와 사진으로 자동 구성됩니다.</p>
        <LinkButton to={`/trips/${projectId}/build?step=${scenes.length ? 3 : 2}`} className="mt-5">
          스토리 만들기
        </LinkButton>
      </div>
    )
  }
  if (!book) return <p className="py-10 text-center text-sm text-on-surface-variant">스토리북을 구성하는 중…</p>

  const save = (patch: Partial<Storybook>) => setStorybook(projectId, { ...book, ...patch, updatedAt: nowIso() })
  const setPages = (pages: BookPage[]) => save({ pages })
  const sel = book.pages.find((p) => p.id === selId) ?? book.pages[0]
  const selIdx = book.pages.findIndex((p) => p.id === sel.id)
  const { w, h } = PAGE_SIZE[book.size]

  const updatePage = (p: BookPage) => setPages(book.pages.map((x) => (x.id === p.id ? p : x)))
  const removePage = () => {
    if (book.pages.length <= 1) return
    const next = book.pages[selIdx + 1] ?? book.pages[selIdx - 1]
    setPages(book.pages.filter((p) => p.id !== sel.id))
    setSelId(next.id)
  }
  const duplicate = () => {
    const copy = { ...sel, id: newId() } as BookPage
    const pages = [...book.pages]
    pages.splice(selIdx + 1, 0, copy)
    setPages(pages)
    setSelId(copy.id)
  }
  const addPage = (kind: BookPageKind) => {
    const p = newPage(kind)
    const pages = [...book.pages]
    // 뒷표지 앞에 넣는다
    const at = pages[pages.length - 1]?.kind === 'back' ? pages.length - 1 : pages.length
    pages.splice(selIdx >= 0 && selIdx < at ? selIdx + 1 : at, 0, p)
    setPages(pages)
    setSelId(p.id)
    setAdding(false)
  }

  const print = async () => {
    setPrinting(true)
    await new Promise((r) => setTimeout(r, 50))
    await printWhenReady()
    setPrinting(false)
  }
  const savePng = async () => {
    if (!pageRef.current) return
    setError(undefined)
    try {
      await exportNode(pageRef.current, 'png', `${project.title}-p${selIdx + 1}`)
    } catch (e) {
      setError(e instanceof Error ? `이미지 저장 실패: ${e.message}` : '이미지 저장 실패')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <span className="label-caps whitespace-nowrap text-on-surface-variant">테마</span>
          <select className={`${inputClass} w-auto`} value={book.theme} onChange={(e) => save({ theme: e.target.value as BookTheme })}>
            {THEMES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <span className="label-caps whitespace-nowrap text-on-surface-variant">판형</span>
          <select className={`${inputClass} w-auto`} value={book.size} onChange={(e) => save({ size: e.target.value as BookSize })}>
            {(Object.keys(PAGE_SIZE) as BookSize[]).map((s) => (
              <option key={s} value={s}>
                {PAGE_SIZE[s].label}
              </option>
            ))}
          </select>
        </label>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={() => setRebuild(true)}>
            <RefreshCw className="h-4 w-4" /> 스토리로 다시 구성
          </Button>
          <Button variant="secondary" size="sm" onClick={savePng}>
            <Download className="h-4 w-4" /> 현재 쪽 PNG
          </Button>
          <Button variant="secondary" size="sm" onClick={() => void print()} loading={printing}>
            <FileText className="h-4 w-4" /> PDF 저장
          </Button>
          <Button size="sm" onClick={() => setViewing(true)}>
            <BookOpen className="h-4 w-4" /> 책으로 보기
          </Button>
        </div>
      </div>
      {error && <Notice tone="error">{error}</Notice>}

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[132px_minmax(0,1fr)_320px]">
        {/* 페이지 목록 */}
        <aside className="order-2 min-w-0 lg:order-1">
          <SortableList
            ids={book.pages.map((p) => p.id)}
            onReorder={(ids) => setPages(ids.map((id) => book.pages.find((p) => p.id === id)!))}
            className="flex gap-3 overflow-x-auto pb-2 lg:max-h-[640px] lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden"
            render={(id, i) => {
              const p = book.pages.find((x) => x.id === id)!
              return (
                <button
                  onClick={() => setSelId(id)}
                  aria-label={`${i + 1}쪽 ${KIND_LABEL[p.kind]}`}
                  className={cn('block w-[104px] shrink-0 text-left lg:w-full', p.id === sel.id && 'rounded-md ring-2 ring-primary')}
                >
                  <ScaledPage w={w} h={h} className="rounded-md border border-outline-variant/60 shadow-card">
                    <BookPageView page={p} book={book} chapterNo={nums.get(p.id)} pageNo={i + 1} />
                  </ScaledPage>
                  <p className="mt-1 truncate text-[11px] text-on-surface-variant">
                    {i + 1}. {KIND_LABEL[p.kind]}
                  </p>
                </button>
              )
            }}
          />
          <div className="mt-2">
            <Button variant="ghost" size="sm" className="w-full" onClick={() => setAdding(!adding)}>
              <Plus className="h-4 w-4" /> 쪽 추가
            </Button>
            {adding && (
              <div className="mt-1 grid gap-1 rounded-md bg-surface-low p-1.5">
                {ADDABLE.map((k) => (
                  <button key={k} onClick={() => addPage(k)} className="rounded px-2 py-1.5 text-left text-xs hover:bg-surface-high">
                    {KIND_LABEL[k]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* 미리보기 */}
        <section className="order-1 min-w-0 lg:order-2">
          <div className="mx-auto" style={{ maxWidth: Math.min(w, 560) }}>
            <ScaledPage w={w} h={h} className="rounded-md shadow-card-hover">
              <BookPageView ref={pageRef} page={sel} book={book} chapterNo={nums.get(sel.id)} pageNo={selIdx + 1} />
            </ScaledPage>
            <div className="mt-3 flex items-center justify-between text-xs text-on-surface-variant">
              <span>
                {selIdx + 1} / {book.pages.length}쪽 · {KIND_LABEL[sel.kind]}
              </span>
              <span className="truncate pl-3">{summary(sel).slice(0, 24)}</span>
            </div>
          </div>
        </section>

        {/* 속성 */}
        <aside className="order-3 min-w-0 rounded-xl bg-surface-lowest p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-lg font-bold">{KIND_LABEL[sel.kind]} 편집</p>
            <div className="flex gap-1">
              <button onClick={duplicate} aria-label="쪽 복제" title="쪽 복제" className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container">
                <Copy className="h-4 w-4" />
              </button>
              <button onClick={removePage} disabled={book.pages.length <= 1} aria-label="쪽 삭제" title="쪽 삭제" className="rounded-full p-2 text-on-surface-variant hover:bg-error-container hover:text-error disabled:opacity-30">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
          <PageEditor key={sel.id} page={sel} photos={data.photos} analyses={data.analyses} onChange={updatePage} />
        </aside>
      </div>

      {viewing && <BookViewer book={book} onClose={() => setViewing(false)} startIndex={selIdx} />}
      {printing && <PrintRoot book={book} />}
      <ConfirmDialog
        open={rebuild}
        onClose={() => setRebuild(false)}
        title="스토리로 스토리북을 다시 구성할까요?"
        confirmLabel="다시 구성"
        message="지금 스토리와 사진으로 레이아웃·판형을 최적화해 모든 쪽을 새로 만듭니다. 스토리북에서 직접 수정한 내용(쪽 순서·문장·사진)은 사라집니다."
        onConfirm={() => setStorybook(projectId, buildStorybook({ project, story, scenes, card, photos: data.photos, analyses: data.analyses, theme: book.theme }))}
      />
    </div>
  )
}
