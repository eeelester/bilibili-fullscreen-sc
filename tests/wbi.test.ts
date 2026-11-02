import { clearWbiKeys, wbi } from '../entrypoints/fullScreen.content/wbi'

describe('WBI signing', () => {
  beforeEach(() => {
    clearWbiKeys()
    jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        code: -101,
        data: { wbi_img: {
          img_url: 'https://i0.hdslb.com/bfs/wbi/7cd084941338484aae1ad9425b84077c.png',
          sub_url: 'https://i0.hdslb.com/bfs/wbi/4932caff0ff746eab6f01bf08b70ac45.png',
        } },
      }),
    } as Response)
  })
  afterEach(() => { jest.restoreAllMocks(); jest.useRealTimers() })
  it('preserves the caller parameters and caches keys for a bounded time', async () => {
    jest.useFakeTimers()
    const params = { id: 7777 }
    const signed = await wbi(params)
    expect(params).toEqual({ id: 7777 })
    expect(signed).toMatch(/^id=7777&wts=\d+&w_rid=[a-f0-9]{32}$/)
    await wbi({ id: 42 })
    expect(fetch).toHaveBeenCalledTimes(1)
    jest.setSystemTime(Date.now() + 5 * 60_000 + 1)
    await wbi(params)
    expect(fetch).toHaveBeenCalledTimes(2)
    clearWbiKeys()
    await wbi(params)
    expect(fetch).toHaveBeenCalledTimes(3)
  })
})
