import { connectRoom } from '../entrypoints/fullScreen.content/liveConnection'
import { clearWbiKeys } from '../entrypoints/fullScreen.content/wbi'
import { processData } from '../utils'
import { testData } from './testData'

jest.mock('../utils', () => ({ processData: jest.fn() }))
jest.mock('../entrypoints/fullScreen.content/wbi', () => ({ wbi: jest.fn(async () => 'id=7777&signed=1'), clearWbiKeys: jest.fn() }))
jest.mock('bilibili-live-ws', () => {
  const { EventEmitter } = require('node:events')
  class MockSocket extends EventEmitter {
    static instances: MockSocket[] = []
    closed = false
    connectCount = 0
    constructor(public roomId: number, public options: unknown) {
      super()
      MockSocket.instances.push(this)
      this.connect()
    }
    connect() { this.connectCount++ }
    close() { this.closed = true }
  }
  return { KeepLiveWS: MockSocket }
})

const sockets = () => (require('bilibili-live-ws').KeepLiveWS.instances as {
  roomId: number, options: unknown, closed: boolean, connectCount: number,
  connect: () => void, emit: (event: string, data?: unknown) => void,
}[])
const response = (data: unknown, code = 0) => ({ ok: true, json: async () => ({ code, data }) }) as Response
const flush = async () => { for (let i = 0; i < 20; i++) await Promise.resolve() }

describe('live room connection', () => {
  let fetchMock: jest.SpyInstance
  let close: (() => void) | undefined
  beforeEach(() => {
    jest.useFakeTimers()
    sockets().length = 0
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    fetchMock = jest.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input)
      if (url.includes('get_info')) return response({ room_id: 7777 })
      if (url.includes('getInfoByRoom')) return response({ super_chat_info: { message_list: [] } })
      if (url.includes('/account')) return response({ mid: 42 })
      if (url.includes('getDanmuInfo')) return response({ token: 'test-token' })
      throw new Error('Unexpected request')
    })
  })
  afterEach(() => {
    close?.()
    close = undefined
    jest.restoreAllMocks()
    jest.useRealTimers()
  })

  it('connects with existing authentication parameters even if history fails', async () => {
    const normal = fetchMock.getMockImplementation()!
    fetchMock.mockImplementation((input: string, init: RequestInit) => input.includes('getInfoByRoom')
      ? Promise.resolve({ ok: false, status: 503, statusText: 'Unavailable' } as Response)
      : normal(input, init))
    close = connectRoom('7777')
    await flush()
    expect(sockets()).toHaveLength(1)
    expect(sockets()[0].options).toEqual({ protover: 3, key: 'test-token', uid: 42 })
    sockets()[0].emit('SUPER_CHAT_MESSAGE', testData)
    expect(processData).toHaveBeenCalledWith(testData)
  })

  it('retries transient initialization failures and stops retrying after close', async () => {
    fetchMock.mockRejectedValueOnce(new Error('offline'))
    close = connectRoom('7777')
    await flush()
    expect(sockets()).toHaveLength(0)
    expect(clearWbiKeys).toHaveBeenCalled()
    await jest.advanceTimersByTimeAsync(1000)
    expect(sockets()).toHaveLength(1)
    close()
    expect(jest.getTimerCount()).toBe(0)
    sockets()[0].connect()
    expect(sockets()[0].connectCount).toBe(1)
    expect(sockets()[0].closed).toBe(true)
  })

  it('does not create a socket after an obsolete request completes', async () => {
    let resolve!: (value: Response) => void
    fetchMock.mockImplementationOnce(() => new Promise<Response>((done) => { resolve = done }))
    close = connectRoom('7777')
    close()
    resolve(response({ room_id: 7777 }))
    await flush()
    expect(sockets()).toHaveLength(0)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(jest.getTimerCount()).toBe(0)
  })

  it('allows logged-out account responses and preserves anonymous uid behavior', async () => {
    const normal = fetchMock.getMockImplementation()!
    fetchMock.mockImplementation((input: string, init: RequestInit) => input.includes('/account')
      ? Promise.resolve(response(null, -101))
      : normal(input, init))
    close = connectRoom('7777')
    await flush()
    expect(sockets()[0].options).toEqual(expect.objectContaining({ uid: 0 }))
  })

  it('refreshes history once authenticated and ignores events after disposal', async () => {
    close = connectRoom('7777')
    await flush()
    sockets()[0].emit('live')
    await flush()
    expect(fetchMock.mock.calls.filter(([url]) => String(url).includes('getInfoByRoom'))).toHaveLength(2)
    close()
    jest.mocked(processData).mockClear()
    sockets()[0].emit('SUPER_CHAT_MESSAGE', testData)
    expect(processData).not.toHaveBeenCalled()
  })
})
