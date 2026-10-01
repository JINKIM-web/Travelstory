import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { ConfirmDialog, Modal, Notice, PhotoImg, inputClass } from '@/components/common/ui'
import PhotoDropzone from '@/components/photo/PhotoDropzone'
import { useProject, useProjectData, useProjectStore } from '@/stores/projectStore'
import type { PhotoAnalysis, TravelPhoto } from '@/types'

export default function Album() {
  const { projectId = '' } = useParams()
  const project = useProject(projectId)
  const data = useProjectData(projectId)
  const removePhoto = useProjectStore((s) => s.removePhoto)
  const setAnalyses = useProjectStore((s) => s.setAnalyses)
  const [view, setView] = useState<TravelPhoto>()
  const [del, setDel] = useState<TravelPhoto>()
  if (!project) return null
  const viewAnalysis = view ? data.analyses.find((a) => a.photoId === view.id) : undefined
  const patchAnalysis = (patch: Partial<PhotoAnalysis>) =>
    viewAnalysis && setAnalyses(projectId, data.analyses.map((a) => (a.id === viewAnalysis.id ? { ...a, ...patch } : a)))

  const unassigned = data.scenes.length > 0 && data.photos.some((p) => !data.scenes.some((s) => s.photoIds.includes(p.id)))

  return (
    <div className="space-y-5">
      <p className="text-sm text-on-surface-variant">실제 여행 사진을 그대로 보관하는 공간입니다 · 총 {data.photos.length}장</p>
      <PhotoDropzone projectId={projectId} compact />
      {unassigned && <Notice>씬에 반영되지 않은 새 사진이 있습니다. &lsquo;사진·씬 편집&rsquo;에서 씬을 다시 구성하세요.</Notice>}

      {data.photos.length === 0 ? (
        <p className="rounded-lg bg-surface-low p-10 text-center text-sm text-on-surface-variant">아직 사진이 없어요.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {data.photos.map((p) => (
            <li key={p.id} className="group relative">
              <button className="block w-full overflow-hidden rounded-md" onClick={() => setView(p)} aria-label={`${p.fileName} 크게 보기`}>
                <PhotoImg photoId={p.id} alt={p.fileName} className="aspect-square w-full transition group-hover:scale-105" />
              </button>
              <button
                onClick={() => setDel(p)}
                aria-label="사진 삭제"
                className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white opacity-0 transition focus:opacity-100 group-hover:opacity-100"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Modal open={!!view} onClose={() => setView(undefined)} title={view?.fileName ?? ''}>
        {view && <PhotoImg photoId={view.id} kind="original" className="max-h-[50vh] w-full rounded-md object-contain" alt={view.fileName} />}
        {view && viewAnalysis && (
          <div className="mt-4 space-y-3 rounded-md bg-surface-low p-3 text-sm">
            <p className="label-caps text-on-surface-variant">AI 분석 결과 (수정하면 이후 씬·스토리 생성에 반영됩니다)</p>
            <div className="grid grid-cols-2 gap-2">
              <label>
                <span className="text-xs text-on-surface-variant">장면 유형</span>
                <input className={`${inputClass} mt-1`} value={viewAnalysis.scene} onChange={(e) => patchAnalysis({ scene: e.target.value })} />
              </label>
              <label>
                <span className="text-xs text-on-surface-variant">분위기</span>
                <input className={`${inputClass} mt-1`} value={viewAnalysis.mood ?? ''} onChange={(e) => patchAnalysis({ mood: e.target.value || undefined })} />
              </label>
            </div>
            <label className="block">
              <span className="text-xs text-on-surface-variant">설명</span>
              <textarea className={`${inputClass} mt-1`} value={viewAnalysis.description} onChange={(e) => patchAnalysis({ description: e.target.value })} />
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <span className="text-xs text-on-surface-variant">중요도 (1~10)</span>
                <input type="number" min={1} max={10} className={`${inputClass} w-20`} value={viewAnalysis.importanceScore} onChange={(e) => patchAnalysis({ importanceScore: Math.min(10, Math.max(1, Number(e.target.value) || 1)) })} />
              </label>
              {viewAnalysis.confidence !== undefined && <span className="text-xs text-on-surface-variant">AI 신뢰도 {Math.round(viewAnalysis.confidence * 100)}%</span>}
            </div>
          </div>
        )}
        {view && !viewAnalysis && <p className="mt-3 text-sm text-on-surface-variant">아직 AI 분석 전인 사진입니다.</p>}
      </Modal>
      <ConfirmDialog
        open={!!del}
        onClose={() => setDel(undefined)}
        title="사진을 삭제할까요?"
        confirmLabel="삭제"
        message="이 사진과 분석 결과가 삭제되고 씬에서도 제거됩니다. 이미 생성된 스토리 문장은 바뀌지 않습니다."
        onConfirm={() => del && void removePhoto(projectId, del.id)}
      />
    </div>
  )
}
