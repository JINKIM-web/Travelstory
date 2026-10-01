import { useEffect, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { Loader2, X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { usePhotoUrl } from '@/hooks/usePhotoUrl'

const variants = {
  primary: 'bg-primary text-on-primary hover:bg-primary-container shadow-[0_6px_18px_-8px_rgba(158,60,38,0.7)]',
  secondary: 'bg-surface-container text-on-surface hover:bg-surface-high',
  ghost: 'border border-outline-variant bg-surface-lowest text-on-surface hover:bg-surface-low',
  danger: 'bg-error text-white hover:opacity-90',
}
const sizes = { sm: 'px-4 py-2 text-sm', md: 'px-6 py-3 text-[15px]', lg: 'px-8 py-4 text-base' }

interface BtnStyle {
  variant?: keyof typeof variants
  size?: keyof typeof sizes
}
const btnClass = ({ variant = 'primary', size = 'md' }: BtnStyle, extra?: string) =>
  cn(
    'inline-flex min-h-[40px] items-center justify-center gap-2 rounded-full font-semibold transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
    variants[variant],
    sizes[size],
    extra,
  )

export function Button({
  variant,
  size,
  loading,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & BtnStyle & { loading?: boolean }) {
  return (
    <button {...props} disabled={props.disabled || loading} className={btnClass({ variant, size }, className)}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}

export function LinkButton({ variant, size, className, ...props }: LinkProps & BtnStyle) {
  return <Link {...props} className={btnClass({ variant, size }, className)} />
}

export function Chip({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'primary' | 'sage' | 'amber' }) {
  const tones = {
    neutral: 'bg-surface-container text-on-surface-variant',
    primary: 'bg-primary-fixed text-primary',
    sage: 'bg-secondary-container text-secondary',
    amber: 'bg-tertiary-fixed text-tertiary',
  }
  return <span className={cn('inline-flex items-center rounded-full px-3 py-1.5 text-[13px] font-medium', tones[tone])}>{children}</span>
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-xl bg-surface-lowest p-6 shadow-card-hover"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} aria-label="닫기" className="rounded-full p-1 hover:bg-surface-container">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = '확인',
  onConfirm,
  onClose,
}: {
  open: boolean
  title: string
  message: ReactNode
  confirmLabel?: string
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="text-sm text-on-surface-variant">{message}</div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          취소
        </Button>
        <Button
          variant="danger"
          onClick={() => {
            onConfirm()
            onClose()
          }}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}

export function PhotoImg({
  photoId,
  kind = 'thumb',
  className,
  alt = '',
  eager,
}: {
  photoId?: string
  kind?: 'thumb' | 'original' | 'print'
  className?: string
  alt?: string
  eager?: boolean
}) {
  const url = usePhotoUrl(photoId, kind)
  return url ? (
    <img src={url} alt={alt} loading={eager ? 'eager' : 'lazy'} className={cn('object-cover', className)} />
  ) : (
    <div className={cn('animate-pulse bg-surface-high', className)} aria-hidden />
  )
}

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  return (
    <div>
      {label && <p className="mb-1 text-xs text-on-surface-variant">{label}</p>}
      <div className="h-2 overflow-hidden rounded-full bg-surface-high">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.round(value * 100)}%` }} />
      </div>
    </div>
  )
}

export function Notice({ tone = 'info', children }: { tone?: 'info' | 'error'; children: ReactNode }) {
  return (
    <div
      className={cn(
        'rounded-xl px-4 py-3 text-[15px]',
        tone === 'error' ? 'bg-error-container text-error' : 'bg-tertiary-fixed text-tertiary',
      )}
    >
      {children}
    </div>
  )
}

export const inputClass =
  'w-full rounded-xl border border-outline-variant bg-surface-lowest px-4 py-3 text-[15px] outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15'
