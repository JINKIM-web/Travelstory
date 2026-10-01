import { forwardRef, type CSSProperties } from 'react'
import type { StoryCard, StoryProject } from '@/types'
import { usePhotoUrl } from '@/hooks/usePhotoUrl'
import { formatRange } from '@/utils/date'

/** 360×450 (4:5) 또는 360×640 (9:16) 고정 크기. 내보낼 때 pixelRatio 3 → 1080×1350 / 1080×1920 */
const StoryCardPreview = forwardRef<HTMLDivElement, { card: StoryCard; project: StoryProject }>(function StoryCardPreview(
  { card, project },
  ref,
) {
  const cover = usePhotoUrl(card.coverPhotoId, 'original')
  const bg = card.backgroundUrl
  const tall = card.ratio === '9:16'
  const isImageBg = !!bg && !bg.startsWith('linear-gradient')
  const bgStyle: CSSProperties = bg
    ? bg.startsWith('linear-gradient')
      ? { background: bg }
      : { backgroundImage: `url(${bg})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: '#3a2a26' }
  const place = project.destination ?? ''
  const period = formatRange(project.startDate, project.endDate)

  const photo = cover ? (
    <img src={cover} alt="" className="h-full w-full object-cover" />
  ) : (
    <div className="h-full w-full bg-surface-high" />
  )

  return (
    <div ref={ref} className="relative w-[360px] overflow-hidden rounded-[28px] text-white" style={{ ...bgStyle, height: tall ? 640 : 450 }}>
      {card.template === 'editorial' && (
        <>
          <div className="absolute inset-0 bg-black/35" />
          <div className="relative flex h-full flex-col p-6">
            <p className="text-[9px] tracking-[0.25em] opacity-80">TRAVELCANVAS AI EDITION</p>
            <p className="mt-1 font-serif text-xl font-bold uppercase tracking-wide">{place || project.title}</p>
            <div className="mx-auto mt-4 w-[78%] bg-white p-2 pb-6 text-on-surface shadow-lg">
              <div className={tall ? 'aspect-[3/4] overflow-hidden' : 'aspect-[4/3] overflow-hidden'}>{photo}</div>
              <p className="mt-1.5 truncate text-[9px] text-on-surface-variant">
                {card.title}
                {period && ` · ${period}`}
              </p>
            </div>
            <div className="mt-auto rounded-xl bg-black/40 p-3 backdrop-blur-sm">
              <p className="font-serif text-[13px] italic leading-relaxed">“{card.quote}”</p>
            </div>
          </div>
        </>
      )}

      {card.template === 'polaroid' && (
        <div className="flex h-full items-center justify-center p-5">
          <div className="w-full rotate-[-2deg] bg-[#fdfaf4] p-3 pb-5 text-on-surface shadow-2xl">
            <div className="aspect-[1/1] overflow-hidden">{photo}</div>
            <p className="mt-3 text-center font-serif text-base font-semibold leading-snug">{card.title}</p>
            <p className="mt-1.5 text-center font-serif text-[12px] italic leading-relaxed text-on-surface-variant">“{card.quote}”</p>
            <p className="mt-2 text-center text-[9px] tracking-widest text-on-surface-variant">
              {[place, period].filter(Boolean).join(' · ').toUpperCase()}
            </p>
          </div>
        </div>
      )}

      {card.template === 'poster' && (
        <>
          <div className="absolute inset-0">{cover ? <img src={cover} alt="" className="h-full w-full object-cover" /> : null}</div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/30" />
          <div className="relative flex h-full flex-col justify-between p-6">
            <p className="text-[9px] tracking-[0.25em] opacity-90">{[place, period].filter(Boolean).join(' · ').toUpperCase()}</p>
            <div>
              <p className="font-serif text-2xl font-bold leading-tight">{card.title}</p>
              <p className="mt-3 font-serif text-[13px] italic leading-relaxed opacity-95">“{card.quote}”</p>
            </div>
          </div>
        </>
      )}
      {isImageBg && card.backgroundCredit && card.template !== 'poster' && (
        <p className="absolute bottom-1.5 right-4 text-[7px] opacity-70">{card.backgroundCredit}</p>
      )}
    </div>
  )
})

export default StoryCardPreview
