import type { TravelScene } from '@/types'
import { newId } from './id'

const renumber = (scenes: TravelScene[]) => scenes.map((s, i) => ({ ...s, order: i }))

export const updateScene = (scenes: TravelScene[], id: string, patch: Partial<TravelScene>) =>
  scenes.map((s) => (s.id === id ? { ...s, ...patch } : s))

export function moveScene(scenes: TravelScene[], id: string, dir: -1 | 1) {
  const arr = [...scenes]
  const i = arr.findIndex((s) => s.id === id)
  const j = i + dir
  if (i < 0 || j < 0 || j >= arr.length) return scenes
  ;[arr[i], arr[j]] = [arr[j], arr[i]]
  return renumber(arr)
}

export const deleteScene = (scenes: TravelScene[], id: string) => renumber(scenes.filter((s) => s.id !== id))

export function addScene(scenes: TravelScene[], projectId: string): TravelScene[] {
  return renumber([
    ...scenes,
    { id: newId(), projectId, title: `새 씬 ${scenes.length + 1}`, photoIds: [], order: scenes.length },
  ])
}

export function movePhoto(scenes: TravelScene[], photoId: string, toSceneId: string) {
  return scenes.map((s) => {
    const without = s.photoIds.filter((p) => p !== photoId)
    if (s.id === toSceneId) {
      return { ...s, photoIds: [...without, photoId], coverPhotoId: s.coverPhotoId ?? photoId }
    }
    return {
      ...s,
      photoIds: without,
      coverPhotoId: s.coverPhotoId === photoId ? without[0] : s.coverPhotoId,
    }
  })
}

export const removePhotoFromScenes = (scenes: TravelScene[], photoId: string) =>
  scenes.map((s) => {
    const photoIds = s.photoIds.filter((p) => p !== photoId)
    return { ...s, photoIds, coverPhotoId: s.coverPhotoId === photoId ? photoIds[0] : s.coverPhotoId }
  })
