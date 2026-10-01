import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Check, Images } from 'lucide-react'
import { useProjectData } from '@/stores/projectStore'
import { cn } from '@/utils/cn'

export type StepKey = 1 | 2 | 3 | 4 | 5 | 6
type StepState = 'done' | 'current' | 'waiting'

const STEPS: { n: StepKey; label: string; to: (id: string) => string }[] = [
  { n: 1, label: '여행 정보', to: (id) => `/trips/${id}/build?step=1` },
  { n: 2, label: '사진 업로드 & AI 분석', to: (id) => `/trips/${id}/build?step=2` },
  { n: 3, label: '여행 기억 문답', to: (id) => `/trips/${id}/build?step=3` },
  { n: 4, label: '감성 스토리 생성', to: (id) => `/trips/${id}/story` },
  { n: 5, label: '스토리 카드 발행', to: (id) => `/trips/${id}/story-card` },
  { n: 6, label: '스토리북', to: (id) => `/trips/${id}/storybook` },
]

const LABEL: Record<StepState, string> = { done: '완료', current: '진행 중', waiting: '대기' }

/**
 * 프로젝트 진행 단계 (왼쪽 세로 목록). 완료/대기 상태는 저장된 데이터에서 계산하고,
 * 지금 보고 있는 화면은 "진행 중" 으로 강조한다. 모바일에서는 가로로 넘겨 본다.
 */
export default function ProjectStepper({ projectId, current }: { projectId?: string; current?: StepKey }) {
  const data = useProjectData(projectId)
  const list = useRef<HTMLOListElement>(null)

  // 모바일(가로 스크롤)에서는 현재 단계가 보이도록 목록만 스크롤한다. (페이지는 움직이지 않음)
  useEffect(() => {
    const ol = list.current
    const el = ol?.querySelector<HTMLElement>('[aria-current=step]')?.parentElement
    if (ol && el && ol.scrollWidth > ol.clientWidth) ol.scrollLeft = Math.max(0, el.offsetLeft - 12)
  }, [current])

  const done: Record<StepKey, boolean> = {
    1: !!projectId,
    2: data.photos.length > 0 && data.scenes.length > 0 && data.photos.every((p) => data.analyses.some((a) => a.photoId === p.id)),
    3: !!data.story || data.memory.some((m) => m.answer.trim().length > 0),
    4: !!data.story,
    5: !!data.card?.published,
    6: !!data.storybook,
  }

  return (
    <nav aria-label="프로젝트 진행 단계">
      <ol ref={list} className="relative flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
        {STEPS.map((s) => {
          const state: StepState = current === s.n ? 'current' : done[s.n] ? 'done' : 'waiting'
          const body = (
            <>
              <span
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold',
                  state === 'done' && 'bg-primary-fixed text-primary-container',
                  state === 'waiting' && 'bg-surface-container text-on-surface-variant',
                  state === 'current' && 'bg-white/25 text-white',
                )}
              >
                {state === 'done' ? <Check className="h-4 w-4" strokeWidth={3} /> : String(s.n).padStart(2, '0')}
              </span>
              <span className="min-w-0">
                <span className={cn('block text-[11px] font-semibold leading-tight', state === 'current' ? 'text-white/85' : 'text-on-surface-variant')}>
                  {LABEL[state]}
                </span>
                <span className="block text-[15px] font-bold leading-snug">{s.label}</span>
              </span>
            </>
          )
          const cls = cn(
            'flex min-h-[60px] items-center gap-3 rounded-[14px] border px-3.5 py-2.5 transition',
            state === 'current'
              ? 'border-transparent bg-primary-container text-white shadow-[0_8px_20px_-10px_rgba(190,84,60,0.9)]'
              : 'border-outline-variant bg-surface-lowest text-on-surface hover:border-primary-container/50',
          )
          return (
            <li key={s.n} className="min-w-[200px] shrink-0 lg:min-w-0">
              {projectId ? (
                <Link to={s.to(projectId)} className={cls} aria-current={state === 'current' ? 'step' : undefined}>
                  {body}
                </Link>
              ) : (
                <div className={cn(cls, 'opacity-80')} aria-current={state === 'current' ? 'step' : undefined}>
                  {body}
                </div>
              )}
            </li>
          )
        })}
      </ol>

      {projectId && (
        <Link
          to={`/trips/${projectId}/photos`}
          className="mt-3 hidden items-center gap-2 rounded-xl px-3.5 py-2.5 text-[15px] font-semibold text-on-surface-variant hover:bg-surface-container lg:flex"
        >
          <Images className="h-[18px] w-[18px]" /> 원본 앨범
        </Link>
      )}
    </nav>
  )
}
