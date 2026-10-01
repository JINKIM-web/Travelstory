/** 프로젝트 백업(.zip) 저장/복원. project.json + photos/<id> 원본 파일 */
import { strFromU8, strToU8, unzipSync, zipSync, type Zippable } from 'fflate'
import type { StoryProject } from '@/types'
import { resizeToBlob } from '@/services/image'
import { getPhoto, savePhoto } from '@/services/storage/indexedDB'
import { loadProjectData, type ProjectData } from '@/services/storage/localStorage'
import { newId } from '@/utils/id'

const VERSION = 1

interface BackupFile {
  app: 'travelcanvasai'
  version: number
  project: StoryProject
  data: ProjectData
}

export async function exportProject(project: StoryProject): Promise<Blob> {
  const data = loadProjectData(project.id)
  const files: Zippable = {
    'project.json': strToU8(JSON.stringify({ app: 'travelcanvasai', version: VERSION, project, data } satisfies BackupFile)),
  }
  for (const ph of data.photos) {
    const rec = await getPhoto(ph.id)
    if (rec) files[`photos/${ph.id}`] = [new Uint8Array(await rec.original.arrayBuffer()), { level: 0 }]
  }
  return new Blob([zipSync(files) as BlobPart], { type: 'application/zip' })
}

/** 백업의 모든 projectId·photoId 를 새 ID 로 바꿔 항상 "새 프로젝트"로 복원한다. (기존 프로젝트 덮어쓰기 방지) */
export function remapIds(text: string, oldProjectId: string, photoIds: string[]) {
  let out = text.split(oldProjectId).join(newId())
  const map = new Map<string, string>()
  for (const id of photoIds) {
    const n = newId()
    map.set(id, n)
    out = out.split(id).join(n)
  }
  return { text: out, photoMap: map }
}

export async function importBackup(file: File): Promise<{ project: StoryProject; data: ProjectData }> {
  let zip: Record<string, Uint8Array>
  try {
    zip = unzipSync(new Uint8Array(await file.arrayBuffer()))
  } catch {
    throw new Error('백업 파일(.zip)을 열 수 없습니다.')
  }
  const raw = zip['project.json']
  if (!raw) throw new Error('TravelCanvasAI 백업 파일이 아닙니다.')
  const parsed = JSON.parse(strFromU8(raw)) as BackupFile
  if (parsed.app !== 'travelcanvasai' || !parsed.project || !parsed.data) throw new Error('TravelCanvasAI 백업 파일이 아닙니다.')
  if (parsed.version > VERSION) throw new Error('더 새로운 버전의 백업 파일입니다. 앱을 업데이트해 주세요.')

  const { text, photoMap } = remapIds(strFromU8(raw), parsed.project.id, parsed.data.photos.map((p) => p.id))
  const fresh = JSON.parse(text) as BackupFile
  const project: StoryProject = { ...fresh.project, title: fresh.project.title }

  // 썸네일 재생성은 디코딩 비용이 커서 4장씩 병렬로 처리한다.
  const restorable = parsed.data.photos.filter((ph) => zip[`photos/${ph.id}`])
  for (let i = 0; i < restorable.length; i += 4) {
    await Promise.all(
      restorable.slice(i, i + 4).map(async (ph) => {
        const original = new Blob([zip[`photos/${ph.id}`] as BlobPart], { type: ph.mimeType })
        const thumb = (await resizeToBlob(original, 480, 0.8)).blob
        await savePhoto({ id: photoMap.get(ph.id)!, projectId: project.id, original, thumb })
      }),
    )
  }
  // 사진 파일이 없는 항목은 메타데이터에서 제외
  const have = new Set(parsed.data.photos.filter((p) => zip[`photos/${p.id}`]).map((p) => photoMap.get(p.id)!))
  const data: ProjectData = { ...fresh.data, photos: fresh.data.photos.filter((p) => have.has(p.id)) }
  project.photoIds = data.photos.map((p) => p.id)
  return { project, data }
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName.replace(/[\/:*?"<>|]/g, '_')
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
