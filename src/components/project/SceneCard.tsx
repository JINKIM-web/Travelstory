import { ChevronDown, ChevronUp, Trash2, X } from 'lucide-react'
import type { TravelScene } from '@/types'
import { Chip, PhotoImg, inputClass } from '@/components/common/ui'
import { SortableList } from '@/components/common/Sortable'
import { cn } from '@/utils/cn'
import { formatSceneDate } from '@/utils/date'

export interface SceneCardProps {
  scene: TravelScene
  index: number
  total: number
  allScenes: TravelScene[]
  onChange: (patch: Partial<TravelScene>) => void
  onMove: (dir: -1 | 1) => void
  onDelete: () => void
  onSetCover: (photoId: string) => void
  onRemovePhoto: (photoId: string) => void
  onMovePhoto: (photoId: string, toSceneId: string) => void
  onReorderPhotos: (photoIds: string[]) => void
}

export default function SceneCard(p: SceneCardProps) {
  const { scene } = p
  return (
    <article className="rounded-xl bg-surface-lowest p-5 shadow-card md:p-6">
      <header className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-primary px-2.5 py-1 label-caps text-on-primary">Scene {String(p.index + 1).padStart(2, '0')}</span>
        <span className="text-xs text-on-surface-variant">
          {[formatSceneDate(scene.date), scene.location].filter(Boolean).join(' · ')}
        </span>
        <div className="ml-auto flex gap-1">
          <IconBtn label="위로" disabled={p.index === 0} onClick={() => p.onMove(-1)}>
            <ChevronUp className="h-4 w-4" />
          </IconBtn>
          <IconBtn label="아래로" disabled={p.index === p.total - 1} onClick={() => p.onMove(1)}>
            <ChevronDown className="h-4 w-4" />
          </IconBtn>
          <IconBtn label="씬 삭제" onClick={p.onDelete}>
            <Trash2 className="h-4 w-4" />
          </IconBtn>
        </div>
      </header>

      <input
        aria-label="씬 제목"
        className="mt-3 w-full border-b border-transparent bg-transparent text-xl font-bold outline-none hover:border-outline-variant focus:border-primary"
        value={scene.title}
        onChange={(e) => p.onChange({ title: e.target.value })}
      />
      {scene.keywords && scene.keywords.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {scene.keywords.map((k) => (
            <Chip key={k} tone="sage">
              #{k}
            </Chip>
          ))}
        </div>
      )}

      {scene.photoIds.length === 0 ? (
        <p className="mt-4 rounded-md bg-surface-low p-4 text-center text-sm text-on-surface-variant">
          사진이 없습니다. 다른 씬의 사진에서 &lsquo;이동&rsquo;을 선택해 가져오세요.
        </p>
      ) : (
        <SortableList
          horizontal
          ids={scene.photoIds}
          onReorder={p.onReorderPhotos}
          className="mt-4 flex gap-3 overflow-x-auto pb-2"
          render={(id) => {
            const isCover = scene.coverPhotoId === id
            return (
              <div
                key={id}
                className={cn(
                  'group relative h-36 w-28 shrink-0 overflow-hidden rounded-md',
                  isCover && 'ring-2 ring-primary',
                )}
              >
                <button type="button" className="h-full w-full" onClick={() => p.onSetCover(id)} aria-label="대표 사진으로 지정">
                  <PhotoImg photoId={id} className="h-full w-full" />
                </button>
                {isCover && <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-on-primary">대표</span>}
                <button
                  type="button"
                  onClick={() => p.onRemovePhoto(id)}
                  aria-label="사진 삭제"
                  className="absolute right-1 top-1 rounded-full bg-black/50 p-0.5 text-white hover:bg-black/70"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                {p.allScenes.length > 1 && (
                  <select
                    aria-label="다른 씬으로 이동"
                    value=""
                    onChange={(e) => e.target.value && p.onMovePhoto(id, e.target.value)}
                    className={cn(inputClass, 'absolute inset-x-1 bottom-1 w-auto bg-black/60 px-1 py-0.5 text-[11px] text-white opacity-0 focus:opacity-100 group-hover:opacity-100')}
                  >
                    <option value="">이동…</option>
                    {p.allScenes
                      .filter((s) => s.id !== scene.id)
                      .map((s) => (
                        <option key={s.id} value={s.id} className="text-black">
                          {s.title}
                        </option>
                      ))}
                  </select>
                )}
              </div>
            )
          }}
        />
      )}
    </article>
  )
}

function IconBtn({ label, children, ...props }: { label: string; children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...props}
      className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container disabled:opacity-30"
    >
      {children}
    </button>
  )
}
