import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { Storybook } from '@/types/storybook'
import { useViewport } from '@/hooks/useViewport'
import { PAGE_SIZE, chapterNumbers } from '@/services/storybook/build'
import BookPageView from './BookPageView'
import ScaledPage from '@/components/common/ScaledPage'

/** 전체 화면 책 뷰어. 데스크톱은 양면 펼침, 모바일은 한 쪽씩. */
export default function BookViewer({ book, onClose, startIndex = 0 }: { book: Storybook; onClose: () => void; startIndex?: number }) {
  const { w: vw, h: vh } = useViewport()
  const double = vw >= 1024
  const pages = book.pages
  const nums = useMemo(() => chapterNumbers(book.pages), [book.pages])
  const { w, h } = PAGE_SIZE[book.size]

  // 양면: [표지] [1,2] [3,4] ... / 단면: 한 쪽씩
  const spreads = useMemo(() => {
    if (!double) return pages.map((_, i) => [i])
    const s: (number | null)[][] = [[null, 0]]
    for (let i = 1; i < pages.length; i += 2) s.push([i, i + 1 < pages.length ? i + 1 : null])
    return s
  }, [double, pages])

  const spreadOf = (pageIdx: number) => Math.max(0, spreads.findIndex((s) => s.includes(pageIdx)))
  const [cur, setCur] = useState(() => spreadOf(startIndex))
  const clamp = (n: number) => Math.min(spreads.length - 1, Math.max(0, n))
  const go = (d: number) => setCur((c) => clamp(c + d))

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
      else if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  })

  const availH = vh - 150
  const availW = vw - (double ? 160 : 40)
  const pageW = Math.floor(Math.min(double ? availW / 2 : availW, availH * (w / h)))
  const spread = spreads[clamp(cur)]

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#2b2420]/95" role="dialog" aria-modal="true" aria-label="스토리북 뷰어">
      <div className="flex items-center justify-between px-5 py-3 text-white">
        <p className="text-lg font-bold">{pages[0]?.kind === 'cover' ? pages[0].title : '스토리북'}</p>
        <button onClick={onClose} aria-label="닫기" className="rounded-full p-2 hover:bg-white/10">
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center gap-2 px-3">
        <button onClick={() => go(-1)} disabled={cur === 0} aria-label="이전 쪽" className="rounded-full p-2 text-white hover:bg-white/10 disabled:opacity-20">
          <ChevronLeft className="h-8 w-8" />
        </button>
        <div className="flex shadow-2xl" style={{ width: double ? pageW * 2 : pageW }}>
          {spread.map((idx, i) =>
            idx === null ? (
              <div key={`blank-${i}`} style={{ width: pageW, height: (pageW * h) / w }} className={double && cur === 0 && i === 0 ? '' : 'bg-[#fbf8f3]'} />
            ) : (
              <div key={pages[idx].id} style={{ width: pageW }}>
                <ScaledPage w={w} h={h}>
                  <BookPageView page={pages[idx]} book={book} chapterNo={nums.get(pages[idx].id)} pageNo={idx + 1} />
                </ScaledPage>
              </div>
            ),
          )}
        </div>
        <button onClick={() => go(1)} disabled={cur >= spreads.length - 1} aria-label="다음 쪽" className="rounded-full p-2 text-white hover:bg-white/10 disabled:opacity-20">
          <ChevronRight className="h-8 w-8" />
        </button>
      </div>

      <p className="py-3 text-center text-xs text-white/70">
        {cur + 1} / {spreads.length} · ← → 키로 넘기기
      </p>
    </div>
  )
}
