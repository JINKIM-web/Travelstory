import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Compass, Plus, PlusCircle } from 'lucide-react'
import { cn } from '@/utils/cn'
import ErrorBoundary from './ErrorBoundary'
import Logo from './Logo'
import { Notice } from './ui'
import { useStorageStatus } from '@/hooks/useStorageStatus'

const nav = [
  { to: '/trips', label: '내 여행', short: '내 여행', end: true, icon: Compass },
  { to: '/trips/new', label: '새 여행 만들기', short: '새 여행', end: true, icon: PlusCircle },
]

export default function Layout() {
  const { pathname } = useLocation()
  const storage = useStorageStatus()
  const [dismissed, setDismissed] = useState(false)
  // 대시보드는 히어로 배경이 화면 전체 너비를 쓰므로 컨테이너 없이 렌더한다.
  const fullBleed = pathname === '/trips'

  const banner = !dismissed && (storage.writeFailed || storage.nearFull) && (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div className="flex-1">
        <Notice tone="error">
          {storage.writeFailed
            ? '브라우저 저장 공간이 부족해 일부 변경 사항이 저장되지 않았습니다. 사용하지 않는 프로젝트를 삭제하거나 백업 후 정리해 주세요.'
            : `브라우저 저장 공간이 거의 찼습니다 (${storage.usedMB}MB / ${storage.quotaMB}MB). 프로젝트를 백업한 뒤 정리하는 것을 권장합니다.`}
        </Notice>
      </div>
      <button onClick={() => setDismissed(true)} className="shrink-0 text-sm text-on-surface-variant underline">
        닫기
      </button>
    </div>
  )

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-outline-variant/60 bg-surface-lowest/85 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] max-w-[1280px] items-center gap-6 px-5 md:px-10">
          <Link to="/trips" aria-label="TravelCanvasAI 홈">
            <Logo />
          </Link>
          <nav className="ml-4 hidden gap-1 md:flex" aria-label="주요 메뉴">
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  cn(
                    'rounded-full px-4 py-2 text-[15px] font-semibold text-on-surface-variant transition-colors hover:bg-surface-container',
                    isActive && 'bg-surface-container text-on-surface',
                  )
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
          <Link
            to="/trips/new"
            className="ml-auto hidden items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-[15px] font-semibold text-on-primary shadow-[0_6px_18px_-8px_rgba(158,60,38,0.7)] transition hover:bg-primary-container active:scale-[0.98] md:inline-flex"
          >
            <Plus className="h-4 w-4" /> 새 여행
          </Link>
        </div>
      </header>

      {fullBleed ? (
        <main className="flex-1 pb-24 md:pb-0">
          {banner && <div className="mx-auto max-w-[1280px] px-5 pt-6 md:px-10">{banner}</div>}
          <ErrorBoundary key={pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
      ) : (
        <main className="mx-auto w-full max-w-[1280px] flex-1 px-5 py-8 pb-28 md:px-10 md:py-10 md:pb-12">
          {banner}
          <ErrorBoundary key={pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
      )}

      <footer className="border-t border-outline-variant/60 bg-surface-lowest">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-4 px-5 py-8 pb-28 md:px-10 md:pb-8">
          <div>
            <Logo />
            <p className="mt-2 text-sm text-on-surface-variant">사진만 올리면 AI가 지나간 여행을 하나의 이야기로 만들어 드려요.</p>
          </div>
          <p className="max-w-sm text-sm text-on-surface-variant">
            사진은 이 브라우저에만 저장됩니다. 중요한 여행은 <Link to="/trips" className="font-medium underline">내 여행</Link>에서 백업을 저장해 두세요.
          </p>
        </div>
      </footer>

      {/* 모바일 하단 탭바 */}
      <nav
        className="fixed inset-x-3 bottom-3 z-40 flex rounded-full border border-outline-variant/70 bg-surface-lowest/95 px-2 shadow-card-hover backdrop-blur-xl md:hidden"
        style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="주요 메뉴"
      >
        {nav.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) =>
              cn(
                'my-1.5 flex min-h-[48px] flex-1 flex-col items-center justify-center gap-0.5 rounded-full text-xs font-semibold text-on-surface-variant',
                isActive && 'bg-primary text-on-primary',
              )
            }
          >
            <n.icon className="h-5 w-5" />
            {n.short}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
