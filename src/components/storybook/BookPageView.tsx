import { forwardRef, type CSSProperties, type ReactNode } from 'react'
import type { BookPage, BookTheme, ChapterPage, Storybook } from '@/types/storybook'
import { PhotoImg } from '@/components/common/ui'
import { PAGE_SIZE } from '@/services/storybook/build'
import { bgStyle } from '@/utils/background'
import { cn } from '@/utils/cn'

interface Tokens {
  paper: string
  fg: string
  muted: string
  accent: string
  frame: string
}

const THEMES: Record<BookTheme, Tokens> = {
  editorial: { paper: '#fbf8f3', fg: '#171c23', muted: '#6b625e', accent: '#9e3c26', frame: '' },
  polaroid: { paper: '#efe6d8', fg: '#2b2420', muted: '#7a6e63', accent: '#82511f', frame: 'bg-[#fdfaf4] p-1.5 pb-4 shadow-[0_6px_16px_rgba(60,40,20,0.25)]' },
  minimal: { paper: '#ffffff', fg: '#111111', muted: '#777777', accent: '#111111', frame: 'border border-black/10' },
}

export interface BookPageViewProps {
  page: BookPage
  book: Pick<Storybook, 'theme' | 'size' | 'background' | 'backgroundCredit'>
  /** 챕터 번호(연속 쪽 제외) */
  chapterNo?: number
  /** 쪽 번호(표지·뒷표지는 표시 안 함) */
  pageNo?: number
  /** 인쇄·내보내기용: 고해상도 사진을 즉시 로드 */
  print?: boolean
  brandLine?: string
}

const roman = (n: number) => ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX'][n - 1] ?? String(n)

/** 논리 크기(PAGE_SIZE) 그대로 그리는 한 쪽. 화면 축소는 바깥에서 transform 으로 처리한다. */
const BookPageView = forwardRef<HTMLDivElement, BookPageViewProps>(function BookPageView(
  { page, book, chapterNo, pageNo, print, brandLine },
  ref,
) {
  const { w, h } = PAGE_SIZE[book.size]
  const t = THEMES[book.theme]
  const wide = book.size === 'a5'
  const style: CSSProperties = { width: w, height: h, background: t.paper, color: t.fg }

  const Photo = ({ id, className, hq }: { id: string; className?: string; hq?: boolean }) => (
    <PhotoImg photoId={id} kind={print ? 'print' : hq ? 'original' : 'thumb'} eager={print} className={cn('h-full w-full', className)} />
  )

  let inner: ReactNode = null

  if (page.kind === 'cover') {
    inner = (
      <div className="relative h-full w-full overflow-hidden text-white">
        {page.photoId && <div className="absolute inset-0"><Photo id={page.photoId} hq /></div>}
        {!page.photoId && <div className="absolute inset-0" style={bgStyle(book.background)} />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/30" />
        <div className="relative flex h-full flex-col justify-between p-10">
          <p className="text-[10px] tracking-[0.3em] opacity-90">TRAVELCANVAS AI EDITION</p>
          <div>
            <h1 className={cn('font-serif font-bold leading-tight', wide ? 'text-[38px]' : 'text-[34px]')}>{page.title}</h1>
            {page.subtitle && <p className="mt-3 text-[12px] tracking-[0.15em] opacity-90">{page.subtitle.toUpperCase()}</p>}
          </div>
        </div>
      </div>
    )
  } else if (page.kind === 'intro') {
    inner = (
      <div className="flex h-full flex-col p-12">
        <p className="label-caps" style={{ color: t.accent }}>Prologue</p>
        <p className="mt-6 whitespace-pre-line text-[14px] leading-[1.9]">{page.body}</p>
        {page.quote && (
          <blockquote className="mt-auto border-l-2 pl-4 font-serif text-[18px] italic leading-relaxed" style={{ borderColor: t.accent }}>
            “{page.quote}”
          </blockquote>
        )}
      </div>
    )
  } else if (page.kind === 'chapter') {
    inner = <ChapterView page={page} t={t} chapterNo={chapterNo} wide={wide} Photo={Photo} theme={book.theme} />
  } else if (page.kind === 'quote') {
    inner = (
      <div className="relative flex h-full items-center justify-center overflow-hidden p-14 text-center text-white" style={bgStyle(book.background)}>
        <div className="absolute inset-0 bg-black/35" />
        <p className="relative font-serif text-[26px] italic leading-relaxed">“{page.text}”</p>
        {book.backgroundCredit && !book.background?.startsWith('linear') && (
          <p className="absolute bottom-3 right-4 text-[8px] opacity-70">{book.backgroundCredit}</p>
        )}
      </div>
    )
  } else if (page.kind === 'closing') {
    inner = (
      <div className="flex h-full flex-col p-12">
        <p className="label-caps" style={{ color: t.accent }}>Epilogue</p>
        <p className="mt-6 whitespace-pre-line font-serif text-[18px] leading-[1.9]">{page.body}</p>
        {page.tags.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-2">
            {page.tags.map((tag) => (
              <span key={tag} className="rounded-full border px-3 py-1 text-[11px]" style={{ borderColor: t.muted, color: t.muted }}>
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    )
  } else {
    inner = (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <p className="font-serif text-[24px] font-semibold">TravelCanvasAI</p>
        <p className="text-[11px] tracking-[0.2em]" style={{ color: t.muted }}>
          {brandLine ?? 'AI STORYBOOK'}
        </p>
      </div>
    )
  }

  const showNo = pageNo !== undefined && page.kind !== 'cover' && page.kind !== 'back' && page.kind !== 'quote'
  return (
    <div ref={ref} style={style} className="relative overflow-hidden" data-page-id={page.id}>
      {inner}
      {showNo && (
        <span className="absolute bottom-4 left-0 right-0 text-center text-[10px] tracking-widest" style={{ color: t.muted }}>
          {pageNo}
        </span>
      )}
    </div>
  )
})

function ChapterView({
  page,
  t,
  chapterNo,
  wide,
  Photo,
  theme,
}: {
  page: ChapterPage
  t: Tokens
  chapterNo?: number
  wide: boolean
  Photo: (p: { id: string; className?: string; hq?: boolean }) => ReactNode
  theme: BookTheme
}) {
  const ids = page.photoIds
  const frame = (id: string, i: number, cls?: string) => (
    <figure key={id} className={cn('flex min-h-0 min-w-0 flex-col', cls)}>
      <div
        className={cn('min-h-0 flex-1 overflow-hidden', t.frame, theme === 'polaroid' && (i % 2 ? 'rotate-[1.2deg]' : '-rotate-[1.2deg]'))}
      >
        <div className="h-full w-full overflow-hidden">{Photo({ id, hq: page.layout === 'full' })}</div>
      </div>
      {page.captions[id] && <figcaption className="mt-1 text-center font-serif text-[10px] italic" style={{ color: t.muted }}>{page.captions[id]}</figcaption>}
    </figure>
  )

  // 본문 길이에 따라 글자 크기를 단계적으로 줄여 넘치지 않게 한다.
  const len = page.body.length
  const textOnly = page.layout === 'text'
  const fontSize = textOnly
    ? len <= 260 ? 17 : len <= 480 ? 15.5 : len <= 760 ? 14 : 12.5
    : len <= 110 ? 14 : len <= 200 ? 13 : len <= 300 ? 12 : 11
  const variant = page.variant

  return (
    <div className="flex h-full flex-col px-11 pb-12 pt-10">
      <p className="label-caps" style={{ color: t.accent }}>
        {page.continued ? 'Continued' : `Chapter ${chapterNo ? roman(chapterNo) : ''}`}
      </p>
      <h2 className={cn('mt-2 font-serif font-semibold leading-snug', page.continued ? 'text-[16px]' : wide ? 'text-[26px]' : 'text-[24px]')}>{page.heading}</h2>
      {page.body && (
        <p className={cn('mt-3 whitespace-pre-line leading-[1.85]', textOnly ? 'flex-1 overflow-hidden' : 'shrink-0')} style={{ fontSize }}>
          {page.body}
        </p>
      )}
      {!textOnly && ids.length > 0 && (
        <div
          className={cn(
            'mt-4 min-h-0 flex-1',
            page.layout === 'full' && 'flex flex-col',
            page.layout === 'duo' && cn('grid gap-4', variant === 'stack' ? 'grid-cols-1 grid-rows-2' : 'grid-cols-2 grid-rows-1'),
            page.layout === 'trio' && cn('grid gap-3', variant === 'top' ? 'grid-cols-2 grid-rows-[3fr_2fr]' : 'grid-cols-[3fr_2fr] grid-rows-2'),
          )}
        >
          {page.layout === 'full' && frame(ids[0], 0, 'flex-1')}
          {page.layout === 'duo' && ids.slice(0, 2).map((id, i) => frame(id, i))}
          {page.layout === 'trio' && (
            <>
              {frame(ids[0], 0, variant === 'top' ? 'col-span-2' : 'row-span-2')}
              {ids[1] && frame(ids[1], 1)}
              {ids[2] && frame(ids[2], 2)}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default BookPageView
