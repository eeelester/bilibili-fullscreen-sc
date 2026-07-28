const MAX_DELETED_SC_IDS = 200
const DELETED_SC_STORAGE_VERSION = 1

function getDeletedScStorageKey(pathname: string) {
  const roomId = pathname.match(/^\/(\d+)/)?.[1] ?? 'preview'
  return `bilibili-fullscreen-sc:deleted:${roomId}`
}

function readDeletedScIds(targetStorage: Pick<Storage, 'getItem'>, key: string) {
  try {
    const value: unknown = JSON.parse(targetStorage.getItem(key) ?? 'null')
    const ids = isDeletedScStorageValue(value) ? value.ids : Array.isArray(value) ? value : []
    if (!Array.isArray(ids))
      return []

    return ids.filter((id): id is number => typeof id === 'number' && Number.isFinite(id)).slice(-MAX_DELETED_SC_IDS)
  }
  catch {
    return []
  }
}

function writeDeletedScIds(targetStorage: Pick<Storage, 'setItem'>, key: string, ids: Iterable<number>) {
  try {
    targetStorage.setItem(key, JSON.stringify({
      version: DELETED_SC_STORAGE_VERSION,
      ids: Array.from(ids).slice(-MAX_DELETED_SC_IDS),
    }))
  }
  catch {
    // The in-memory deletion state remains valid when storage is unavailable.
  }
}

function isDeletedScStorageValue(value: unknown): value is { version: 1, ids: unknown[] } {
  return Boolean(
    value
    && typeof value === 'object'
    && 'version' in value
    && value.version === DELETED_SC_STORAGE_VERSION
    && 'ids' in value
    && Array.isArray(value.ids),
  )
}

export { getDeletedScStorageKey, readDeletedScIds, writeDeletedScIds }
