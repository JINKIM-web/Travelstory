import type {
  MemoryAnswer,
  PhotoAnalysis,
  StoryCard,
  StoryProject,
  TravelPhoto,
  TravelScene,
  TravelStory,
} from '@/types'
import type { Storybook } from '@/types/storybook'

export interface ProjectData {
  photos: TravelPhoto[]
  analyses: PhotoAnalysis[]
  scenes: TravelScene[]
  story: TravelStory | null
  card: StoryCard | null
  memory: MemoryAnswer[]
  storybook: Storybook | null
}

export const emptyData = (): ProjectData => ({
  photos: [],
  analyses: [],
  scenes: [],
  story: null,
  card: null,
  memory: [],
  storybook: null,
})

const PROJECTS_KEY = 'tc:projects'
const key = (projectId: string, part: keyof ProjectData) => `tc:${projectId}:${part}`

function read<T>(k: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(k)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write(k: string, value: unknown) {
  try {
    localStorage.setItem(k, JSON.stringify(value))
  } catch (e) {
    console.error('LocalStorage 저장 실패', e)
    window.dispatchEvent(new CustomEvent('tc:storage-error'))
  }
}

export const loadProjects = () => read<StoryProject[]>(PROJECTS_KEY, [])
export const saveProjects = (projects: StoryProject[]) => write(PROJECTS_KEY, projects)

export function loadProjectData(projectId: string): ProjectData {
  const d = emptyData()
  return {
    photos: read(key(projectId, 'photos'), d.photos),
    analyses: read(key(projectId, 'analyses'), d.analyses),
    scenes: read(key(projectId, 'scenes'), d.scenes),
    story: read(key(projectId, 'story'), d.story),
    card: read(key(projectId, 'card'), d.card),
    memory: read(key(projectId, 'memory'), d.memory),
    storybook: read(key(projectId, 'storybook'), d.storybook),
  }
}

export const saveProjectPart = <K extends keyof ProjectData>(projectId: string, part: K, value: ProjectData[K]) =>
  write(key(projectId, part), value)

export function removeProjectData(projectId: string) {
  for (const part of Object.keys(emptyData()) as (keyof ProjectData)[]) {
    localStorage.removeItem(key(projectId, part))
  }
}
