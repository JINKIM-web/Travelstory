import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import PrintRoot from '@/components/storybook/PrintRoot'
import { importBackup } from '@/services/backup'
import type { Storybook } from '@/types/storybook'

declare global {
  interface Window {
    /** 모든 페이지 이미지가 로드되어 PDF 로 저장할 준비가 되면 true (scripts/export-pdf.mjs 가 기다림) */
    __printReady?: boolean
  }
}

/**
 * 백업(.zip)의 스토리북을 인쇄용으로 렌더하는 페이지. 화면에는 거의 아무것도 보이지 않고,
 * 인쇄(print) 미디어에서만 모든 쪽이 보인다. `npm run export-pdf` 가 헤드리스 Chrome 으로 이 페이지를 PDF 로 저장한다.
 *
 *   /print-book?src=/sample-backup/xxx.travelcanvas.zip
 */
export default function PrintBook() {
  const [params] = useSearchParams()
  const src = params.get('src')
  const [book, setBook] = useState<Storybook>()
  const [error, setError] = useState<string>()

  useEffect(() => {
    if (!src) return
    let alive = true
    void (async () => {
      try {
        const res = await fetch(src)
        if (!res.ok) throw new Error(`백업 파일을 불러올 수 없습니다 (${res.status})`)
        const { data } = await importBackup(new File([await res.blob()], 'backup.zip'))
        if (!data.storybook) throw new Error('이 백업에는 스토리북이 없습니다.')
        if (alive) setBook(data.storybook)
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : String(e))
      }
    })()
    return () => {
      alive = false
    }
  }, [src])

  // 모든 사진이 실제로 그려질 때까지 기다린 뒤 준비 완료 표시
  useEffect(() => {
    if (!book) return
    let alive = true
    void (async () => {
      for (let i = 0; i < 600 && alive; i++) {
        const root = document.getElementById('print-root')
        const imgs = [...(root?.querySelectorAll('img') ?? [])]
        const pending = root?.querySelectorAll('.animate-pulse').length ?? 0
        if (root && pending === 0 && imgs.length > 0 && imgs.every((im) => im.complete && im.naturalWidth > 0)) {
          await document.fonts.ready
          window.__printReady = true
          return
        }
        await new Promise((r) => setTimeout(r, 200))
      }
    })()
    return () => {
      alive = false
    }
  }, [book])

  if (!src) return <p className="p-6 text-sm">?src= 로 백업 파일 주소를 지정하세요.</p>
  if (error) return <p className="p-6 text-sm text-error">{error}</p>
  return (
    <div className="p-6 text-sm text-on-surface-variant">
      {book ? '스토리북을 PDF 로 저장할 준비를 하고 있습니다…' : '백업을 불러오는 중…'}
      {book && <PrintRoot book={book} />}
    </div>
  )
}
