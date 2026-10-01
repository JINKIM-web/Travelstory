import { toJpeg, toPng } from 'html-to-image'

export async function exportNode(node: HTMLElement, format: 'png' | 'jpeg', fileName: string) {
  // 웹폰트 임베딩(Pretendard 서브셋 수백 개)이 매우 느려 건너뛴다 → 내보낸 이미지는 시스템 세리프 폰트로 그려진다
  const opts = { pixelRatio: 3, backgroundColor: '#ffffff', skipFonts: true }
  const url = format === 'png' ? await toPng(node, opts) : await toJpeg(node, { ...opts, quality: 0.95 })
  const a = document.createElement('a')
  a.href = url
  a.download = `${fileName.replace(/[\\/:*?"<>|]/g, '_')}.${format === 'png' ? 'png' : 'jpg'}`
  a.click()
}
