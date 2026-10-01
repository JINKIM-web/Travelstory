import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import type { BookPage, ChapterLayout, ChapterPage, ChapterVariant } from '@/types/storybook'
import type { PhotoAnalysis, TravelPhoto } from '@/types'
import { Button, Modal, PhotoImg, inputClass } from '@/components/common/ui'
import { SortableList } from '@/components/common/Sortable'
import { LAYOUT_CAPACITY, arrange, photoInfoMap } from '@/services/storybook/build'
import { cn } from '@/utils/cn'

const LAYOUTS: { id: ChapterLayout; label: string }[] = [
  { id: 'text', label: '텍스트' },
  { id: 'full', label: '풀 사진' },
  { id: 'duo', label: '2분할' },
  { id: 'trio', label: '3분할' },
]

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label-caps text-on-surface-variant">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  )
}

function PhotoPicker({
  photos,
  exclude,
  onPick,
  onClose,
}: {
  photos: TravelPhoto[]
  exclude: string[]
  onPick: (id: string) => void
  onClose: () => void
}) {
  const list = photos.filter((p) => !exclude.includes(p.id))
  return (
    <Modal open onClose={onClose} title="사진 선택">
      {list.length === 0 ? (
        <p className="text-sm text-on-surface-variant">선택할 수 있는 사진이 없습니다.</p>
      ) : (
        <div className="grid max-h-[60vh] grid-cols-4 gap-2 overflow-y-auto">
          {list.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                onPick(p.id)
                onClose()
              }}
              aria-label={`${p.fileName} 선택`}
              className="aspect-square overflow-hidden rounded-md hover:ring-2 hover:ring-primary"
            >
              <PhotoImg photoId={p.id} className="h-full w-full" />
            </button>
          ))}
        </div>
      )}
    </Modal>
  )
}

export default function PageEditor({
  page,
  photos,
  analyses = [],
  onChange,
}: {
  page: BookPage
  photos: TravelPhoto[]
  analyses?: PhotoAnalysis[]
  onChange: (p: BookPage) => void
}) {
  const [picking, setPicking] = useState<'cover' | 'chapter'>()

  if (page.kind === 'back') return <p className="text-sm text-on-surface-variant">뒷표지는 편집할 내용이 없습니다.</p>

  if (page.kind === 'cover') {
    return (
      <div className="space-y-4">
        <Field label="제목">
          <input className={inputClass} value={page.title} onChange={(e) => onChange({ ...page, title: e.target.value })} />
        </Field>
        <Field label="부제 (여행지 · 기간)">
          <input className={inputClass} value={page.subtitle} onChange={(e) => onChange({ ...page, subtitle: e.target.value })} />
        </Field>
        <div>
          <span className="label-caps text-on-surface-variant">표지 사진</span>
          <div className="mt-1 flex items-center gap-3">
            <div className="h-20 w-16 overflow-hidden rounded-md bg-surface-high">{page.photoId && <PhotoImg photoId={page.photoId} className="h-full w-full" />}</div>
            <Button variant="secondary" size="sm" onClick={() => setPicking('cover')}>
              사진 바꾸기
            </Button>
          </div>
        </div>
        {picking === 'cover' && <PhotoPicker photos={photos} exclude={[]} onPick={(id) => onChange({ ...page, photoId: id })} onClose={() => setPicking(undefined)} />}
      </div>
    )
  }

  if (page.kind === 'intro') {
    return (
      <div className="space-y-4">
        <Field label="도입 본문">
          <textarea className={`${inputClass} min-h-40`} value={page.body} onChange={(e) => onChange({ ...page, body: e.target.value })} />
        </Field>
        <Field label="요약 인용">
          <textarea className={`${inputClass} min-h-20 font-serif italic`} value={page.quote} onChange={(e) => onChange({ ...page, quote: e.target.value })} />
        </Field>
      </div>
    )
  }

  if (page.kind === 'quote') {
    return (
      <Field label="핵심 문장">
        <textarea className={`${inputClass} min-h-28 font-serif italic`} value={page.text} onChange={(e) => onChange({ ...page, text: e.target.value })} />
      </Field>
    )
  }

  if (page.kind === 'closing') {
    return (
      <div className="space-y-4">
        <Field label="마무리 문장">
          <textarea className={`${inputClass} min-h-40`} value={page.body} onChange={(e) => onChange({ ...page, body: e.target.value })} />
        </Field>
        <Field label="태그 (쉼표로 구분)">
          <input
            className={inputClass}
            value={page.tags.join(', ')}
            onChange={(e) => onChange({ ...page, tags: e.target.value.split(',').map((t) => t.trim().replace(/^#/, '')).filter(Boolean) })}
          />
        </Field>
      </div>
    )
  }

  // chapter
  const ch: ChapterPage = page
  const cap = LAYOUT_CAPACITY[ch.layout]
  const info = photoInfoMap(photos, analyses)
  const setLayout = (layout: ChapterLayout) => {
    const ids = ch.photoIds.slice(0, LAYOUT_CAPACITY[layout])
    const a = arrange(ids, info)
    onChange({ ...ch, layout, photoIds: ids, variant: layout === 'duo' || layout === 'trio' ? a.variant : undefined })
  }
  const autoLayout = () => {
    const a = arrange(ch.photoIds.slice(0, 3), info)
    onChange({ ...ch, layout: a.layout, variant: a.variant, photoIds: a.photoIds })
  }
  const variants: { id: ChapterVariant; label: string }[] =
    ch.layout === 'duo'
      ? [{ id: 'row', label: '나란히' }, { id: 'stack', label: '위아래' }]
      : ch.layout === 'trio'
        ? [{ id: 'left', label: '큰 사진 왼쪽' }, { id: 'top', label: '큰 사진 위' }]
        : []
  return (
    <div className="space-y-4">
      <Field label="챕터 제목">
        <input className={inputClass} value={ch.heading} onChange={(e) => onChange({ ...ch, heading: e.target.value })} />
      </Field>
      <Field label="본문">
        <textarea className={`${inputClass} min-h-36`} value={ch.body} onChange={(e) => onChange({ ...ch, body: e.target.value })} />
      </Field>
      <div>
        <span className="label-caps text-on-surface-variant">레이아웃</span>
        <div className="mt-1 grid grid-cols-4 gap-1.5">
          {LAYOUTS.map((l) => (
            <button
              key={l.id}
              onClick={() => setLayout(l.id)}
              className={cn('rounded-md border px-2 py-2 text-xs', ch.layout === l.id ? 'border-primary bg-primary-fixed/40 font-semibold text-primary' : 'border-outline-variant')}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>
      {variants.length > 0 && (
        <div className="grid grid-cols-2 gap-1.5">
          {variants.map((v) => (
            <button
              key={v.id}
              onClick={() => onChange({ ...ch, variant: v.id })}
              className={cn('rounded-md border px-2 py-2 text-xs', (ch.variant ?? variants[0].id) === v.id ? 'border-primary bg-primary-fixed/40 font-semibold text-primary' : 'border-outline-variant')}
            >
              {v.label}
            </button>
          ))}
        </div>
      )}
      {ch.photoIds.length > 0 && (
        <Button variant="ghost" size="sm" onClick={autoLayout}>
          사진 비율에 맞게 자동 배치
        </Button>
      )}
      {cap > 0 && (
        <div>
          <span className="label-caps text-on-surface-variant">
            사진 ({ch.photoIds.length}/{cap}) · 끌어서 순서 변경
          </span>
          <SortableList
            horizontal
            ids={ch.photoIds}
            onReorder={(photoIds) => onChange({ ...ch, photoIds })}
            className="mt-2 flex flex-wrap gap-2"
            render={(id) => (
              <div className="w-24">
                <div className="group relative aspect-[3/4] overflow-hidden rounded-md">
                  <PhotoImg photoId={id} className="h-full w-full" />
                  <button
                    onClick={() => onChange({ ...ch, photoIds: ch.photoIds.filter((p) => p !== id) })}
                    aria-label="사진 빼기"
                    onPointerDown={(e) => e.stopPropagation()}
                    className="absolute right-1 top-1 rounded-full bg-black/55 p-0.5 text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <input
                  aria-label="캡션"
                  placeholder="캡션"
                  onPointerDown={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                  className="mt-1 w-full rounded border border-outline-variant px-1.5 py-1 text-[11px]"
                  value={ch.captions[id] ?? ''}
                  onChange={(e) => onChange({ ...ch, captions: { ...ch.captions, [id]: e.target.value } })}
                />
              </div>
            )}
          />
          {ch.photoIds.length < cap && (
            <Button variant="secondary" size="sm" className="mt-2" onClick={() => setPicking('chapter')}>
              <Plus className="h-4 w-4" /> 사진 추가
            </Button>
          )}
        </div>
      )}
      {picking === 'chapter' && (
        <PhotoPicker photos={photos} exclude={ch.photoIds} onPick={(id) => onChange({ ...ch, photoIds: [...ch.photoIds, id] })} onClose={() => setPicking(undefined)} />
      )}
    </div>
  )
}
