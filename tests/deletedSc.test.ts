import { getDeletedScStorageKey, readDeletedScIds, writeDeletedScIds } from '@/utils/deletedSc'

describe('deleted SC storage', () => {
  it('scopes deletion records by room', () => {
    expect(getDeletedScStorageKey('/7777')).toBe('bilibili-fullscreen-sc:deleted:7777')
    expect(getDeletedScStorageKey('/')).toBe('bilibili-fullscreen-sc:deleted:preview')
  })

  it('recovers from malformed storage', () => {
    expect(readDeletedScIds({ getItem: () => '{broken' }, 'key')).toEqual([])
  })

  it('keeps only finite numeric IDs', () => {
    const storage = {
      getItem: () => JSON.stringify([1, '2', null, Number.NaN, 3]),
    }
    expect(readDeletedScIds(storage, 'key')).toEqual([1, 3])
  })

  it('bounds persisted deletion history', () => {
    const setItem = jest.fn()
    writeDeletedScIds({ setItem }, 'key', Array.from({ length: 250 }, (_, index) => index))

    const persisted = JSON.parse(setItem.mock.calls[0][1]) as { version: number, ids: number[] }
    expect(persisted.version).toBe(1)
    expect(persisted.ids).toHaveLength(200)
    expect(persisted.ids[0]).toBe(50)
  })
})
