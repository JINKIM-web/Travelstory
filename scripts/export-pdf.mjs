/**
 * 백업(.zip) 안의 스토리북을 PDF 파일로 저장한다. (헤드리스 Chrome/Edge 사용)
 *
 *   1) 개발 서버를 켠다:   node node_modules/vite/bin/vite.js
 *   2) PDF 로 저장한다:    node scripts/export-pdf.mjs sample-backup/2025-02-trip.travelcanvas.zip out/storybook.pdf
 *
 * 백업 파일은 프로젝트 폴더 안에 있어야 한다(개발 서버가 /경로 로 내려줌).
 * 환경 변수: APP_URL(기본 http://localhost:5173), CHROME_PATH(브라우저 실행 파일)
 */
import fs from 'node:fs'
import path from 'node:path'
import puppeteer from 'puppeteer-core'

const [, , zipArg, outArg = 'out/storybook.pdf'] = process.argv
if (!zipArg) {
  console.error('사용법: node scripts/export-pdf.mjs <백업.zip> [출력.pdf]')
  process.exit(1)
}

const base = process.env.APP_URL ?? 'http://localhost:5173'
const rel = path.relative(process.cwd(), path.resolve(zipArg)).split(path.sep).join('/')
if (rel.startsWith('..')) {
  console.error('백업 파일은 프로젝트 폴더 안에 있어야 합니다.')
  process.exit(1)
}

const candidates = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean)
const executablePath = candidates.find((p) => fs.existsSync(p))
if (!executablePath) {
  console.error('Chrome/Edge 를 찾을 수 없습니다. CHROME_PATH 환경 변수를 지정하세요.')
  process.exit(1)
}

const out = path.resolve(outArg)
fs.mkdirSync(path.dirname(out), { recursive: true })

const browser = await puppeteer.launch({ executablePath, headless: true, args: ['--no-sandbox'] })
try {
  const page = await browser.newPage()
  page.on('pageerror', (e) => console.error('페이지 오류:', e.message))
  const url = `${base}/print-book?src=${encodeURIComponent('/' + rel)}`
  console.log('불러오는 중:', url)
  await page.goto(url, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction('window.__printReady === true', { timeout: 240_000, polling: 500 })

  const size = await page.evaluate(() => {
    const p = document.querySelector('#print-root .print-page')
    return { w: parseInt(p.style.width, 10), h: parseInt(p.style.height, 10), pages: document.querySelectorAll('#print-root .print-page').length }
  })
  console.log(`${size.pages}쪽, ${size.w}×${size.h}px — PDF 로 저장합니다…`)

  await page.pdf({
    path: out,
    width: `${size.w}px`,
    height: `${size.h}px`,
    printBackground: true,
    preferCSSPageSize: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  })
  console.log('저장 완료:', out, `(${(fs.statSync(out).size / 1e6).toFixed(1)}MB)`)
} finally {
  await browser.close()
}
