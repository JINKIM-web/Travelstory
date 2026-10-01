import { useRef, useState } from 'react'
import { ImagePlus } from 'lucide-react'
import { Button, ProgressBar } from '@/components/common/ui'
import { cn } from '@/utils/cn'
import { useProjectStore } from '@/stores/projectStore'

export default function PhotoDropzone({ projectId, compact }: { projectId: string; compact?: boolean }) {
  const addPhotos = useProjectStore((s) => s.addPhotos)
  const input = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number }>()
  const [failed, setFailed] = useState<string[]>([])

  const handle = async (list: FileList | File[]) => {
    const files = [...list].filter((f) => f.type.startsWith('image/') || /\.(heic|heif)$/i.test(f.name))
    if (!files.length) return
    setFailed([])
    setProgress({ done: 0, total: files.length })
    const res = await addPhotos(projectId, files, (done, total) => setProgress({ done, total }))
    setProgress(undefined)
    setFailed(res.failed)
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        void handle(e.dataTransfer.files)
      }}
      className={cn(
        'rounded-lg border-2 border-dashed border-outline-variant bg-surface-lowest p-5 transition-colors',
        over && 'border-primary bg-primary-fixed/30',
      )}
    >
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary-container text-secondary">
          <ImagePlus className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold">{compact ? '사진 추가' : '여행 사진을 올려 주세요'}</p>
          <p className="text-sm text-on-surface-variant">사진을 끌어다 놓거나 파일을 선택하세요 (JPG, PNG, WEBP, HEIC · 여러 장 가능)</p>
        </div>
        <Button variant="secondary" onClick={() => input.current?.click()} disabled={!!progress}>
          파일 선택
        </Button>
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.heic,.heif"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files) void handle(e.target.files)
            e.target.value = ''
          }}
        />
      </div>
      {progress && (
        <div className="mt-4">
          <ProgressBar value={progress.done / progress.total} label={`사진 저장 중 ${progress.done}/${progress.total}`} />
        </div>
      )}
      {failed.length > 0 && (
        <p className="mt-3 text-sm text-error">
          {failed.length}장을 추가하지 못했습니다(손상되었거나 미지원 형식): {failed.slice(0, 3).join(', ')}
          {failed.length > 3 && ' 외'}
        </p>
      )}
    </div>
  )
}
