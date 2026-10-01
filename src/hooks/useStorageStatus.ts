import { useEffect, useState } from 'react'

export interface StorageStatus {
  /** 사용량이 한도의 80%를 넘었는지 */
  nearFull: boolean
  usedMB?: number
  quotaMB?: number
  /** LocalStorage 쓰기 실패가 발생했는지 */
  writeFailed: boolean
}

/** 브라우저 저장 용량을 점검하고, 가능하면 영구 저장을 요청한다. */
export function useStorageStatus(): StorageStatus {
  const [s, setS] = useState<StorageStatus>({ nearFull: false, writeFailed: false })
  useEffect(() => {
    let alive = true
    void (async () => {
      try {
        await navigator.storage?.persist?.()
        const e = await navigator.storage?.estimate?.()
        if (alive && e?.usage !== undefined && e.quota) {
          setS((cur) => ({ ...cur, nearFull: e.usage! / e.quota! > 0.8, usedMB: Math.round(e.usage! / 1e6), quotaMB: Math.round(e.quota! / 1e6) }))
        }
      } catch {
        /* 지원하지 않는 브라우저 */
      }
    })()
    const onErr = () => setS((cur) => ({ ...cur, writeFailed: true }))
    window.addEventListener('tc:storage-error', onErr)
    return () => {
      alive = false
      window.removeEventListener('tc:storage-error', onErr)
    }
  }, [])
  return s
}
