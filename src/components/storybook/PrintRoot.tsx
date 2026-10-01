import { createPortal } from 'react-dom'
import type { Storybook } from '@/types/storybook'
import { PAGE_SIZE, chapterNumbers } from '@/services/storybook/build'
import BookPageView from './BookPageView'

/** 인쇄(PDF 저장) 때만 마운트되는 전체 페이지 렌더. `@page` 크기를 판형에 맞춘다. */
export default function PrintRoot({ book }: { book: Storybook }) {
  const { w, h } = PAGE_SIZE[book.size]
  const nums = chapterNumbers(book.pages)
  return createPortal(
    <div id="print-root">
      <style>{`@page { size: ${w}px ${h}px; margin: 0 }`}</style>
      {book.pages.map((p, i) => (
        <div key={p.id} className="print-page" style={{ width: w, height: h }}>
          <BookPageView page={p} book={book} chapterNo={nums.get(p.id)} pageNo={i + 1} print />
        </div>
      ))}
    </div>,
    document.body,
  )
}

/** 인쇄 대상 이미지가 모두 로드될 때까지 기다린 뒤 인쇄 창을 연다. */
export async function printWhenReady(timeoutMs = 20000) {
  const start = Date.now()
  await new Promise((r) => setTimeout(r, 100))
  while (Date.now() - start < timeoutMs) {
    const root = document.getElementById('print-root')
    const pending = root?.querySelectorAll('.animate-pulse').length ?? 0
    const imgs = [...(root?.querySelectorAll('img') ?? [])]
    if (pending === 0 && imgs.every((i) => i.complete && i.naturalWidth > 0)) break
    await new Promise((r) => setTimeout(r, 200))
  }
  window.print()
}
