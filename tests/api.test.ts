import { fetchJson } from '../entrypoints/fullScreen.content/api'

describe('API requests', () => {
  afterEach(() => { jest.restoreAllMocks(); jest.useRealTimers() })
  it('rejects business errors even when the HTTP status is successful', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, json: async () => ({ code: -403, message: 'forbidden' }) } as Response)
    await expect(fetchJson('https://example.test')).rejects.toThrow('API error -403')
  })
  it('cancels timed out requests and clears the timeout', async () => {
    jest.useFakeTimers()
    jest.spyOn(globalThis, 'fetch').mockImplementation((_input, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new Error('aborted')), { once: true })
    }))
    const result = expect(fetchJson('https://example.test')).rejects.toThrow('aborted')
    await jest.advanceTimersByTimeAsync(15_000)
    await result
    expect(jest.getTimerCount()).toBe(0)
  })
})
