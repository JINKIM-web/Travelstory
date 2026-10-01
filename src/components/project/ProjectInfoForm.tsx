import { useState } from 'react'
import { Button, inputClass } from '@/components/common/ui'
import type { ProjectInput } from '@/stores/projectStore'

export default function ProjectInfoForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: Partial<ProjectInput>
  submitLabel: string
  onSubmit: (v: ProjectInput) => void
  onCancel?: () => void
}) {
  const [v, setV] = useState<ProjectInput>({
    title: initial?.title ?? '',
    destination: initial?.destination ?? '',
    startDate: initial?.startDate ?? '',
    endDate: initial?.endDate ?? '',
    description: initial?.description ?? '',
  })
  const set = (k: keyof ProjectInput) => (e: { target: { value: string } }) => setV({ ...v, [k]: e.target.value })
  const dateError = v.startDate && v.endDate && v.endDate < v.startDate

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (dateError || !v.title.trim()) return
        onSubmit({
          title: v.title.trim(),
          destination: v.destination?.trim() || undefined,
          startDate: v.startDate || undefined,
          endDate: v.endDate || undefined,
          description: v.description?.trim() || undefined,
        })
      }}
    >
      <label className="block">
        <span className="label-caps text-on-surface-variant">여행 저널 타이틀 *</span>
        <input className={`${inputClass} mt-1`} value={v.title} onChange={set('title')} placeholder="예: 푸른 바다와 돌담길, 제주 초여름 기록" required />
      </label>
      <label className="block">
        <span className="label-caps text-on-surface-variant">여행지</span>
        <input className={`${inputClass} mt-1`} value={v.destination} onChange={set('destination')} placeholder="예: 제주, 대한민국" />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="label-caps text-on-surface-variant">출발일</span>
          <input type="date" className={`${inputClass} mt-1`} value={v.startDate} onChange={set('startDate')} />
        </label>
        <label className="block">
          <span className="label-caps text-on-surface-variant">도착일</span>
          <input type="date" className={`${inputClass} mt-1`} value={v.endDate} min={v.startDate} onChange={set('endDate')} />
        </label>
      </div>
      {dateError && <p className="text-sm text-error">도착일은 출발일 이후여야 합니다.</p>}
      <label className="block">
        <span className="label-caps text-on-surface-variant">여행 메모 (선택)</span>
        <textarea className={`${inputClass} mt-1 min-h-20`} value={v.description} onChange={set('description')} placeholder="누구와, 어떤 마음으로 떠났나요?" />
      </label>
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            취소
          </Button>
        )}
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  )
}
