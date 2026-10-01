/** 이미지 리사이즈 / EXIF 촬영시각 추출 */

export interface Resized {
  blob: Blob
  width: number
  height: number
  sourceWidth: number
  sourceHeight: number
}

export async function resizeToBlob(src: Blob, maxEdge: number, quality = 0.85): Promise<Resized> {
  const bmp = await createImageBitmap(src, { imageOrientation: 'from-image' })
  const scale = Math.min(1, maxEdge / Math.max(bmp.width, bmp.height))
  const width = Math.round(bmp.width * scale)
  const height = Math.round(bmp.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, width, height)
  const sourceWidth = bmp.width
  const sourceHeight = bmp.height
  bmp.close()
  const blob = await new Promise<Blob>((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error('이미지 변환 실패'))), 'image/jpeg', quality),
  )
  return { blob, width, height, sourceWidth, sourceHeight }
}

export const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result as string)
    r.onerror = () => rej(r.error)
    r.readAsDataURL(blob)
  })

export async function readExifDate(file: Blob): Promise<string | undefined> {
  if (file.type !== 'image/jpeg') return undefined
  try {
    const v = new DataView(await file.slice(0, 131072).arrayBuffer())
    if (v.getUint16(0) !== 0xffd8) return undefined
    let off = 2
    while (off + 4 < v.byteLength) {
      const marker = v.getUint16(off)
      if ((marker & 0xff00) !== 0xff00) return undefined
      if (marker === 0xffe1) return parseTiff(v, off + 10, v.getUint32(off + 4) === 0x45786966)
      off += 2 + v.getUint16(off + 2)
    }
  } catch {
    /* EXIF 없음/손상 */
  }
  return undefined
}

function parseTiff(v: DataView, start: number, isExif: boolean): string | undefined {
  if (!isExif) return undefined
  const little = v.getUint16(start) === 0x4949
  const u16 = (o: number) => v.getUint16(o, little)
  const u32 = (o: number) => v.getUint32(o, little)
  const find = (ifd: number, tag: number) => {
    const n = u16(ifd)
    for (let i = 0; i < n; i++) {
      const e = ifd + 2 + i * 12
      if (u16(e) === tag) return e
    }
    return undefined
  }
  const str = (e: number) => {
    const count = u32(e + 4)
    const o = count > 4 ? start + u32(e + 8) : e + 8
    let s = ''
    for (let i = 0; i < count - 1; i++) s += String.fromCharCode(v.getUint8(o + i))
    return s
  }
  const ifd0 = start + u32(start + 4)
  const exifPtr = find(ifd0, 0x8769)
  let entry: number | undefined
  if (exifPtr !== undefined) {
    const exifIfd = start + u32(exifPtr + 8)
    entry = find(exifIfd, 0x9003) ?? find(exifIfd, 0x9004)
  }
  entry ??= find(ifd0, 0x0132)
  if (entry === undefined) return undefined
  const m = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/.exec(str(entry))
  return m ? `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}` : undefined
}

const isHeic = (f: File) => /^image\/hei[cf]$/.test(f.type) || /\.(heic|heif)$/i.test(f.name)

/** HEIC/HEIF 는 JPEG 로 변환한다(변환 라이브러리는 필요할 때만 로드). */
export async function normalizeFile(file: File): Promise<File> {
  if (!isHeic(file)) return file
  const { default: heic2any } = await import('heic2any')
  const out = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 })
  const blob = Array.isArray(out) ? out[0] : out
  return new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), { type: 'image/jpeg', lastModified: file.lastModified })
}

export async function processPhoto(file: File) {
  if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) throw new Error('지원하지 않는 형식(JPG/PNG/WEBP/HEIC)')
  const [thumb, capturedAt] = await Promise.all([resizeToBlob(file, 480, 0.8), readExifDate(file)])
  return {
    thumb: thumb.blob,
    meta: { width: thumb.sourceWidth, height: thumb.sourceHeight, capturedAt },
  }
}
