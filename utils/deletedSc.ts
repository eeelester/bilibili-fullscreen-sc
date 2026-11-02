interface DeletedSc {
  id: number
  expiresAt: number
}

export function getDeletedScStorageKey() {
  return `bilibili-fullscreen-sc:deleted:${location.pathname}`
}

function readRecords(key: string, now: number): DeletedSc[] {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(key) ?? sessionStorage.getItem('deleteId') ?? '[]')
    if (!Array.isArray(value))
      return []
    const records: DeletedSc[] = []
    for (const item of value as unknown[]) {
      if (typeof item === 'number' && Number.isSafeInteger(item) && item > 0)
        records.push({ id: item, expiresAt: now + 24 * 60 * 60_000 })
      else if (item && typeof item === 'object' && 'id' in item && typeof item.id === 'number' && Number.isSafeInteger(item.id) && item.id > 0 && 'expiresAt' in item && typeof item.expiresAt === 'number' && Number.isFinite(item.expiresAt) && item.expiresAt > now)
        records.push({ id: item.id, expiresAt: item.expiresAt })
    }
    return records
  }
  catch {
    return []
  }
}

export function readDeletedScIds(key = getDeletedScStorageKey(), now = Date.now()) {
  return new Set(readRecords(key, now).map(record => record.id))
}

export function rememberDeletedSc(id: number, expiresAt: number, key = getDeletedScStorageKey()) {
  try {
    const records = readRecords(key, Date.now()).filter(record => record.id !== id)
    records.push({ id, expiresAt })
    sessionStorage.setItem(key, JSON.stringify(records))
  }
  catch {
    // 存储不可用时仍允许关闭当前列表中的 SC。
  }
}
