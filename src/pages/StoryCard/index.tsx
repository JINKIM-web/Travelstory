import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CheckCircle2, Download, Sparkles } from 'lucide-react'
import { Button, LinkButton, Notice, PhotoImg, inputClass } from '@/components/common/ui'
import StoryCardPreview from '@/components/story-card/StoryCardPreview'
import { exportNode } from '@/services/image/export'
import { MOOD_GRADIENTS, hasUnsplash, searchBackgrounds, trackDownload, type Background } from '@/services/unsplash'
import { useProject, useProjectData, useProjectStore } from '@/stores/projectStore'
import type { StoryCard as Card, StoryCardTemplate } from '@/types'
import { cn } from '@/utils/cn'
import { newId, nowIso } from '@/utils/id'

const TEMPLATES: { id: StoryCardTemplate; label: string }[] = [
  { id: 'editorial', label: '에디토리얼' },
  { id: 'polaroid', label: '필름 폴라로이드' },
  { id: 'poster', label: '미니멀 포스터' },
]

export default function StoryCardPage() {
  const { projectId = '' } = useParams()
  const project = useProject(projectId)
  const data = useProjectData(projectId)
  const setCard = useProjectStore((s) => s.setCard)
  const ref = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Background[]>([])
  const [searching, setSearching] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string>()
  const [credit, setCredit] = useState<Background>()

  const { story } = data
  const recommended = [...data.analyses].filter((a) => (a.confidence ?? 1) > 0).sort((a, b) => b.importanceScore - a.importanceScore).slice(0, 3)
  const card = data.card

  // 카드가 아직 없으면(스토리 직접 작성 등) 기본 카드를 한 번 만든다.
  useEffect(() => {
    if (!project || card || !story) return
    setCard(projectId, {
      id: newId(),
      projectId,
      template: 'editorial',
      coverPhotoId: data.scenes[0]?.coverPhotoId ?? data.photos[0]?.id,
      title: story.title,
      quote: story.goldenQuote ?? story.summary,
      backgroundUrl: MOOD_GRADIENTS[0].value,
      updatedAt: nowIso(),
    })
  }, [project, card, story, data.scenes, data.photos, projectId, setCard])

  useEffect(() => {
    if (story && !query) setQuery(story.backgroundQuery ?? project?.destination ?? 'travel landscape')
  }, [story, query, project?.destination])

  if (!project) return null
  if (!story || !card) {
    return (
      <div className="rounded-lg bg-surface-low p-10 text-center">
        <p className="text-xl font-bold">스토리를 먼저 생성해 주세요</p>
        <LinkButton to={`/trips/${projectId}/build?step=${data.scenes.length ? 3 : 2}`} className="mt-5">
          스토리 만들기
        </LinkButton>
      </div>
    )
  }

  const update = (p: Partial<Card>) => setCard(projectId, { ...card, ...p, updatedAt: nowIso() })

  const search = async () => {
    setSearching(true)
    setError(undefined)
    try {
      setResults(await searchBackgrounds(query))
    } catch (e) {
      setError(e instanceof Error ? `배경 검색 실패: ${e.message}` : '배경 검색 실패')
    } finally {
      setSearching(false)
    }
  }

  const pick = (bg: Background) => {
    update({ backgroundUrl: bg.value, backgroundCredit: bg.credit })
    setCredit(bg.creditUrl ? bg : undefined)
    void trackDownload(bg)
  }

  const save = async (format: 'png' | 'jpeg') => {
    if (!ref.current) return
    setExporting(true)
    setError(undefined)
    try {
      await exportNode(ref.current, format, `${project.title}-story-card`)
      if (!card.published) update({ published: true })
    } catch (e) {
      setError(e instanceof Error ? `이미지 저장 실패: ${e.message}` : '이미지 저장 실패')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[auto_1fr]">
      <div className="flex justify-center lg:sticky lg:top-24 lg:self-start">
        <div className="max-w-full overflow-x-auto p-1">
          <StoryCardPreview ref={ref} card={card} project={project} />
        </div>
      </div>

      <div className="min-w-0 max-w-xl space-y-6">
        {error && <Notice tone="error">{error}</Notice>}

        <section>
          <h3 className="label-caps mb-2 text-on-surface-variant">스토리 카드 템플릿</h3>
          <div className="grid grid-cols-3 gap-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => update({ template: t.id })}
                className={cn(
                  'rounded-md border px-2 py-3 text-sm',
                  card.template === t.id ? 'border-primary bg-primary-fixed/40 font-semibold text-primary' : 'border-outline-variant',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3 className="label-caps mb-2 text-on-surface-variant">카드 비율</h3>
          <div className="grid grid-cols-2 gap-2">
            {(['4:5', '9:16'] as const).map((r) => (
              <button
                key={r}
                onClick={() => update({ ratio: r })}
                className={cn(
                  'rounded-md border px-2 py-3 text-sm',
                  (card.ratio ?? '4:5') === r ? 'border-primary bg-primary-fixed/40 font-semibold text-primary' : 'border-outline-variant',
                )}
              >
                {r === '4:5' ? '4:5 피드' : '9:16 스토리'}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <label className="block">
            <span className="label-caps text-on-surface-variant">카드 제목</span>
            <input className={`${inputClass} mt-1`} value={card.title} onChange={(e) => update({ title: e.target.value })} />
          </label>
          <label className="block">
            <span className="label-caps text-on-surface-variant">핵심 문장</span>
            <textarea className={`${inputClass} mt-1 min-h-20 font-serif italic`} value={card.quote} onChange={(e) => update({ quote: e.target.value })} />
          </label>
        </section>

        <section>
          <h3 className="label-caps mb-2 text-on-surface-variant">대표 사진</h3>
          {recommended.length > 0 && (
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="flex items-center gap-1 text-on-surface-variant">
                <Sparkles className="h-3.5 w-3.5" /> AI 추천
              </span>
              {recommended.map((r) => (
                <button
                  key={r.photoId}
                  onClick={() => update({ coverPhotoId: r.photoId })}
                  title={r.description}
                  className={cn('flex items-center gap-1.5 rounded-full border py-0.5 pl-0.5 pr-2.5', card.coverPhotoId === r.photoId ? 'border-primary bg-primary-fixed/40' : 'border-outline-variant')}
                >
                  <PhotoImg photoId={r.photoId} className="h-6 w-6 rounded-full" />
                  중요도 {r.importanceScore}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {data.photos.map((p) => (
              <button
                key={p.id}
                onClick={() => update({ coverPhotoId: p.id })}
                aria-label="대표 사진으로 선택"
                className={cn('h-20 w-16 shrink-0 overflow-hidden rounded-md', card.coverPhotoId === p.id && 'ring-2 ring-primary')}
              >
                <PhotoImg photoId={p.id} className="h-full w-full" />
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3 className="label-caps mb-2 text-on-surface-variant">배경 무드 전환 {card.template === 'poster' && '(포스터는 사진 풀블리드)'}</h3>
          <div className="flex gap-2">
            <input
              className={inputClass}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && hasUnsplash && void search()}
              placeholder="배경 검색어 (영어 권장)"
              disabled={!hasUnsplash}
            />
            <Button variant="secondary" onClick={() => void search()} loading={searching} disabled={!hasUnsplash}>
              Unsplash 검색
            </Button>
          </div>
          {!hasUnsplash && (
            <p className="mt-2 text-xs text-on-surface-variant">
              <code>VITE_UNSPLASH_ACCESS_KEY</code>가 없어 Unsplash 검색은 꺼져 있습니다. 아래 무드 그라데이션을 사용하세요.
            </p>
          )}
          <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5">
            {[...MOOD_GRADIENTS, ...results].map((bg) => (
              <button
                key={bg.id}
                onClick={() => pick(bg)}
                aria-label={bg.credit ?? '배경 선택'}
                title={bg.credit}
                className={cn('aspect-[3/4] overflow-hidden rounded-md border', card.backgroundUrl === bg.value ? 'ring-2 ring-primary' : 'border-outline-variant')}
                style={bg.thumb.startsWith('linear') ? { background: bg.thumb } : { backgroundImage: `url(${bg.thumb})`, backgroundSize: 'cover' }}
              />
            ))}
          </div>
          {credit?.creditUrl && (
            <p className="mt-2 text-xs text-on-surface-variant">
              <a href={credit.creditUrl} target="_blank" rel="noreferrer" className="underline">
                {credit.credit}
              </a>
            </p>
          )}
        </section>

        <div className="rounded-xl bg-surface-low p-4">
          <p className="flex items-center gap-2 text-[15px] font-bold">
            {card.published ? <CheckCircle2 className="h-5 w-5 text-secondary" /> : <Sparkles className="h-5 w-5 text-primary" />}
            {card.published ? '이 카드는 발행되었습니다' : '카드를 발행하면 다음 단계(스토리북)로 이어집니다'}
          </p>
          <p className="mt-1 text-sm text-on-surface-variant">발행된 카드는 스토리북 표지에 사용할 수 있습니다. 이미지를 저장해도 자동으로 발행 처리됩니다.</p>
          {!card.published && (
            <Button className="mt-3" onClick={() => update({ published: true })}>
              스토리 카드 발행하기
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="lg" onClick={() => void save('png')} loading={exporting}>
            <Download className="h-5 w-5" /> PNG 고해상도 저장
          </Button>
          <Button size="lg" variant="ghost" onClick={() => void save('jpeg')} disabled={exporting}>
            JPG 저장
          </Button>
        </div>
      </div>
    </div>
  )
}
