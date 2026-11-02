import { readDeletedScIds, rememberDeletedSc } from '../utils/deletedSc'

describe('deleted SC storage', () => {
  let values: Map<string, string>
  beforeEach(() => {
    values = new Map()
    Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value) },
    } })
  })
  it('accepts legacy numeric deletion IDs', () => {
    values.set('deleteId', '[1,2,null,"3",{}]')
    expect([...readDeletedScIds('room', 100)]).toEqual([1, 2])
  })
  it('ignores corrupted storage', () => {
    values.set('room', 'invalid JSON')
    expect(readDeletedScIds('room').size).toBe(0)
  })
  it('prunes expired entries and keeps a single record per ID', () => {
    const now = Date.now()
    values.set('room', JSON.stringify([{ id: 1, expiresAt: now - 1 }, { id: 2, expiresAt: now + 10_000 }]))
    rememberDeletedSc(2, now + 20_000, 'room')
    expect([...readDeletedScIds('room', now)]).toEqual([2])
    expect(JSON.parse(values.get('room')!)).toEqual([{ id: 2, expiresAt: now + 20_000 }])
  })
  it('does not throw if the host disallows session storage', () => {
    Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, get() { throw new Error('denied') } })
    expect(readDeletedScIds('room').size).toBe(0)
    expect(() => rememberDeletedSc(1, Date.now() + 1000, 'room')).not.toThrow()
  })
})
