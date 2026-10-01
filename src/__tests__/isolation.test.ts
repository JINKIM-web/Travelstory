// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { useProjectStore } from '@/stores/projectStore'
import { getPhoto, savePhoto } from '@/services/storage/indexedDB'
import { loadProjectData } from '@/services/storage/localStorage'
import { photo, scene } from './helpers'

const blob = () => new Blob(['x'], { type: 'image/jpeg' })

async function seed(title: string) {
  const s = useProjectStore.getState()
  const p = s.createProject({ title })
  const photos = [photo(`${p.id}-1`, undefined, p.id), photo(`${p.id}-2`, undefined, p.id)]
  for (const ph of photos) await savePhoto({ id: ph.id, projectId: p.id, original: blob(), thumb: blob() })
  s.setPhotos(p.id, photos)
  s.setScenes(p.id, [{ ...scene('s', photos.map((x) => x.id)), projectId: p.id }])
  return { p, photos }
}

describe('프로젝트 격리', () => {
  beforeEach(() => {
    localStorage.clear()
    useProjectStore.setState({ projects: [], data: {} })
  })

  it('한 프로젝트를 삭제해도 다른 프로젝트의 데이터·사진은 그대로다', async () => {
    const a = await seed('A')
    const b = await seed('B')

    await useProjectStore.getState().deleteProject(a.p.id)

    // A: 프로젝트·LocalStorage·IndexedDB 모두 삭제
    expect(useProjectStore.getState().projects.map((p) => p.id)).toEqual([b.p.id])
    expect(loadProjectData(a.p.id).photos).toEqual([])
    expect(await getPhoto(a.photos[0].id)).toBeUndefined()

    // B: 그대로
    expect(loadProjectData(b.p.id).photos).toHaveLength(2)
    expect(loadProjectData(b.p.id).scenes).toHaveLength(1)
    expect(await getPhoto(b.photos[0].id)).toBeDefined()
  })

  it('사진을 지우면 같은 프로젝트의 씬에서도 빠지고 다른 프로젝트는 영향이 없다', async () => {
    const a = await seed('A')
    const b = await seed('B')
    await useProjectStore.getState().removePhoto(a.p.id, a.photos[0].id)
    expect(loadProjectData(a.p.id).photos).toHaveLength(1)
    expect(loadProjectData(a.p.id).scenes[0].photoIds).toEqual([a.photos[1].id])
    expect(loadProjectData(b.p.id).scenes[0].photoIds).toHaveLength(2)
  })
})
