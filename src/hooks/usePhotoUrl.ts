import { useEffect, useState } from 'react'
import { getPhoto } from '@/services/storage/indexedDB'
import { resizeToBlob } from '@/services/image'

/** thumb: 480px 썸네일 / original: 원본 / print: 인쇄·PDF 용 1600px (A5·정사각형 300dpi 급, 용량은 원본의 약 1/15) */
type Kind = 'thumb' | 'original' | 'print'
const cache = new Map<string, Promise<string | undefined>>()

const PRINT_EDGE = 1600

async function makeUrl(photoId: string, kind: Kind) {
  const rec = await getPhoto(photoId)
  if (!rec) return undefined
  if (kind === 'thumb') return URL.createObjectURL(rec.thumb)
  if (kind === 'original') return URL.createObjectURL(rec.original)
  try {
    return URL.createObjectURL((await resizeToBlob(rec.original, PRINT_EDGE, 0.82)).blob)
  } catch {
    return URL.createObjectURL(rec.original)
  }
}

function load(photoId: string, kind: Kind) {
  const k = `${photoId}:${kind}`
  let p = cache.get(k)
  if (!p) {
    p = makeUrl(photoId, kind)
    cache.set(k, p)
  }
  return p
}

export function releasePhotoUrls(photoIds: string[]) {
  for (const id of photoIds) {
    for (const kind of ['thumb', 'original', 'print'] as Kind[]) {
      const k = `${id}:${kind}`
      cache.get(k)?.then((u) => u && URL.revokeObjectURL(u))
      cache.delete(k)
    }
  }
}

export function usePhotoUrl(photoId?: string, kind: Kind = 'thumb') {
  const [url, setUrl] = useState<string>()
  useEffect(() => {
    let alive = true
    setUrl(undefined)
    if (photoId) load(photoId, kind).then((u) => alive && setUrl(u))
    return () => {
      alive = false
    }
  }, [photoId, kind])
  return url
}
