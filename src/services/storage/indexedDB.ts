import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

export interface PhotoRecord {
  id: string
  projectId: string
  original: Blob
  thumb: Blob
}

interface TCDB extends DBSchema {
  photos: {
    key: string
    value: PhotoRecord
    indexes: { 'by-project': string }
  }
}

let dbPromise: Promise<IDBPDatabase<TCDB>> | undefined
const db = () =>
  (dbPromise ??= openDB<TCDB>('travelcanvasai', 1, {
    upgrade(d) {
      const store = d.createObjectStore('photos', { keyPath: 'id' })
      store.createIndex('by-project', 'projectId')
    },
  }))

export const savePhoto = async (rec: PhotoRecord) => void (await (await db()).put('photos', rec))
export const getPhoto = async (id: string) => (await db()).get('photos', id)
export const deletePhoto = async (id: string) => (await db()).delete('photos', id)

export async function deletePhotosByProject(projectId: string) {
  const d = await db()
  const keys = await d.getAllKeysFromIndex('photos', 'by-project', projectId)
  const tx = d.transaction('photos', 'readwrite')
  await Promise.all([...keys.map((k) => tx.store.delete(k)), tx.done])
  return keys
}
