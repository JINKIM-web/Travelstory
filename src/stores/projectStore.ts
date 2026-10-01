import { useEffect } from 'react'
import { create } from 'zustand'
import type { Storybook } from '@/types/storybook'
import type { MemoryAnswer, PhotoAnalysis, StoryCard, StoryProject, TravelPhoto, TravelScene, TravelStory } from '@/types'
import {
  emptyData,
  loadProjectData,
  loadProjects,
  removeProjectData,
  saveProjectPart,
  saveProjects,
  type ProjectData,
} from '@/services/storage/localStorage'
import { deletePhoto, deletePhotosByProject, savePhoto } from '@/services/storage/indexedDB'
import { normalizeFile, processPhoto } from '@/services/image'
import { releasePhotoUrls } from '@/hooks/usePhotoUrl'
import { newId, nowIso } from '@/utils/id'
import { removePhotoFromScenes } from '@/utils/sceneOps'

export type ProjectInput = Pick<StoryProject, 'title' | 'destination' | 'startDate' | 'endDate' | 'description'>

interface State {
  projects: StoryProject[]
  data: Record<string, ProjectData>

  createProject: (input: ProjectInput) => StoryProject
  updateProject: (id: string, patch: Partial<StoryProject>) => void
  deleteProject: (id: string) => Promise<void>
  loadData: (id: string) => ProjectData

  addPhotos: (
    id: string,
    files: File[],
    onProgress?: (done: number, total: number) => void,
  ) => Promise<{ added: number; failed: string[] }>
  removePhoto: (id: string, photoId: string) => Promise<void>

  setAnalyses: (id: string, v: PhotoAnalysis[]) => void
  setScenes: (id: string, v: TravelScene[]) => void
  setStory: (id: string, v: TravelStory | null) => void
  setCard: (id: string, v: StoryCard | null) => void
  setMemory: (id: string, v: MemoryAnswer[]) => void
  setStorybook: (id: string, v: Storybook | null) => void
  setPhotos: (id: string, v: TravelPhoto[]) => void
  importProject: (project: StoryProject, data: ProjectData) => void
}

export const useProjectStore = create<State>((set, get) => {
  const getData = (id: string) => get().data[id] ?? get().loadData(id)

  const setPart = <K extends keyof ProjectData>(id: string, part: K, value: ProjectData[K]) => {
    const cur = getData(id)
    saveProjectPart(id, part, value)
    set((s) => ({ data: { ...s.data, [id]: { ...cur, [part]: value } } }))
    get().updateProject(id, {})
  }

  return {
    projects: loadProjects(),
    data: {},

    createProject: (input) => {
      const now = nowIso()
      const project: StoryProject = {
        ...input,
        id: newId(),
        photoIds: [],
        sceneIds: [],
        pipeline: { analysis: 'idle', scenes: 'idle', story: 'idle' },
        createdAt: now,
        updatedAt: now,
      }
      const projects = [project, ...get().projects]
      saveProjects(projects)
      set({ projects })
      return project
    },

    updateProject: (id, patch) => {
      const projects = get().projects.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: nowIso() } : p))
      saveProjects(projects)
      set({ projects })
    },

    deleteProject: async (id) => {
      const photoIds = get().data[id]?.photos.map((p) => p.id) ?? loadProjectData(id).photos.map((p) => p.id)
      const projects = get().projects.filter((p) => p.id !== id)
      saveProjects(projects)
      removeProjectData(id)
      releasePhotoUrls(photoIds)
      set((s) => {
        const { [id]: _removed, ...rest } = s.data
        return { projects, data: rest }
      })
      await deletePhotosByProject(id)
    },

    loadData: (id) => {
      const d = loadProjectData(id)
      set((s) => ({ data: { ...s.data, [id]: d } }))
      return d
    },

    addPhotos: async (id, files, onProgress) => {
      const added: TravelPhoto[] = []
      const failed: string[] = []
      for (let i = 0; i < files.length; i++) {
        const source = files[i]
        let file = source
        try {
          file = await normalizeFile(source)
          const { thumb, meta } = await processPhoto(file)
          const photo: TravelPhoto = {
            id: newId(),
            projectId: id,
            fileName: file.name,
            mimeType: file.type,
            ...meta,
          }
          await savePhoto({ id: photo.id, projectId: id, original: file, thumb })
          added.push(photo)
        } catch {
          failed.push(source.name)
        }
        onProgress?.(i + 1, files.length)
      }
      if (added.length) {
        const photos = [...getData(id).photos, ...added]
        setPart(id, 'photos', photos)
        get().updateProject(id, { photoIds: photos.map((p) => p.id) })
      }
      return { added: added.length, failed }
    },

    removePhoto: async (id, photoId) => {
      const cur = getData(id)
      const photos = cur.photos.filter((p) => p.id !== photoId)
      setPart(id, 'photos', photos)
      setPart(id, 'analyses', getData(id).analyses.filter((a) => a.photoId !== photoId))
      setPart(id, 'scenes', removePhotoFromScenes(getData(id).scenes, photoId))
      get().updateProject(id, { photoIds: photos.map((p) => p.id) })
      releasePhotoUrls([photoId])
      await deletePhoto(photoId)
    },

    setAnalyses: (id, v) => setPart(id, 'analyses', v),
    setScenes: (id, v) => {
      setPart(id, 'scenes', v)
      get().updateProject(id, { sceneIds: v.map((s) => s.id) })
    },
    setStory: (id, v) => {
      setPart(id, 'story', v)
      get().updateProject(id, { storyId: v?.id })
    },
    setCard: (id, v) => {
      setPart(id, 'card', v)
      get().updateProject(id, { storyCardId: v?.id })
    },
    setMemory: (id, v) => setPart(id, 'memory', v),
    setStorybook: (id, v) => setPart(id, 'storybook', v),
    setPhotos: (id, v) => {
      setPart(id, 'photos', v)
      get().updateProject(id, { photoIds: v.map((p) => p.id) })
    },
    importProject: (project, data) => {
      const projects = [project, ...get().projects]
      saveProjects(projects)
      for (const part of Object.keys(data) as (keyof ProjectData)[]) saveProjectPart(project.id, part, data[part] as never)
      set((s) => ({ projects, data: { ...s.data, [project.id]: data } }))
    },
  }
})

const EMPTY = emptyData()

export function useProjectData(id?: string): ProjectData {
  const data = useProjectStore((s) => (id ? s.data[id] : undefined))
  const loadData = useProjectStore((s) => s.loadData)
  useEffect(() => {
    if (id && !data) loadData(id)
  }, [id, data, loadData])
  return data ?? EMPTY
}

export function useProject(id?: string) {
  return useProjectStore((s) => s.projects.find((p) => p.id === id))
}

export function coverPhotoIdOf(d: ProjectData) {
  return d.card?.coverPhotoId ?? d.scenes.find((s) => s.coverPhotoId)?.coverPhotoId ?? d.photos[0]?.id
}
