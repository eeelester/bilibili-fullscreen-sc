import { useMove, useScExpiration } from '../components/ScList/hook'
import type { ScInfo } from '../components/ScList/type'
import { PositionEnum } from '../constant'

jest.mock('react', () => ({
  useCallback: (callback: Function) => callback,
  useEffect: (callback: () => (() => void) | undefined) => { effects.push(callback) },
  useRef: (current: unknown) => ({ current }),
  useState: (initial: unknown) => {
    state = typeof initial === 'function' ? initial() : initial
    return [state, (next: unknown) => { state = typeof next === 'function' ? next(state) : next }]
  },
}))

let effects: (() => (() => void) | undefined)[]
let cleanups: (() => void)[]
let state: any
let view: EventTarget & { setTimeout: typeof setTimeout, clearTimeout: typeof clearTimeout }
let doc: EventTarget & { defaultView: typeof view, documentElement: { clientWidth: number, clientHeight: number } }
const startEffects = () => { cleanups = effects.map(effect => effect()).filter(Boolean) as (() => void)[] }
const pointer = (type: string, x: number, y: number) => Object.assign(new Event(type, { cancelable: true }), {
  button: 0, pointerId: 1, clientX: x, clientY: y,
})

beforeEach(() => {
  jest.useFakeTimers()
  effects = []
  cleanups = []
  view = Object.assign(new EventTarget(), { setTimeout, clearTimeout })
  doc = Object.assign(new EventTarget(), { defaultView: view, documentElement: { clientWidth: 1920, clientHeight: 1080 } })
})
afterEach(() => { cleanups.forEach(cleanup => cleanup()); jest.useRealTimers() })

describe('SC expiry scheduling', () => {
  const item = (id: number, time: number, delay = 0) => ({ id, time, delay, addedTime: Date.now() }) as ScInfo
  it('uses one deadline timer and removes messages at their remaining lifetime', async () => {
    let list = [item(1, 60, 10), item(2, 30)]
    const setter = (update: any) => { list = update(list) }
    useScExpiration(list, setter, doc as unknown as Document)
    startEffects()
    expect(jest.getTimerCount()).toBe(1)
    await jest.advanceTimersByTimeAsync(30_000)
    expect(list.map(item => item.id)).toEqual([1])
    expect(jest.getTimerCount()).toBe(1)
    await jest.advanceTimersByTimeAsync(20_000)
    expect(list).toHaveLength(0)
    expect(jest.getTimerCount()).toBe(0)
  })
  it('corrects expiry immediately when a suspended page resumes', () => {
    let list = [item(1, 30)]
    useScExpiration(list, (update: any) => { list = update(list) }, doc as unknown as Document)
    startEffects()
    jest.setSystemTime(Date.now() + 60_000)
    doc.dispatchEvent(new Event('visibilitychange'))
    expect(list).toHaveLength(0)
    expect(jest.getTimerCount()).toBe(0)
  })
  it('does not schedule work for an empty list', () => {
    useScExpiration([], jest.fn(), doc as unknown as Document)
    startEffects()
    expect(jest.getTimerCount()).toBe(0)
  })
})

describe('SC dragging', () => {
  it('moves on the first pointer event, accepts zero coordinates, and clamps to the viewport', () => {
    const target = Object.assign(new EventTarget(), {
      closest: () => null,
      setPointerCapture: jest.fn(),
      querySelector: () => ({ getBoundingClientRect: () => ({ width: 270, height: 120 }) }),
    })
    useMove({ current: target as unknown as HTMLDivElement }, doc as unknown as Document, PositionEnum.TOP_LEFT)
    startEffects()
    target.dispatchEvent(pointer('pointerdown', 0, 0))
    doc.dispatchEvent(pointer('pointermove', 10, 10))
    expect(state).toEqual(expect.objectContaining({ left: 20, top: 20 }))
    doc.dispatchEvent(pointer('pointermove', 10_000, 10_000))
    expect(state.left).toBe(1650)
    expect(state.top).toBe(960)
    doc.dispatchEvent(pointer('pointerup', 10_000, 10_000))
    doc.dispatchEvent(pointer('pointermove', 1, 1))
    expect(state.left).toBe(1650)
    doc.documentElement.clientWidth = 1000
    view.dispatchEvent(new Event('resize'))
    expect(state.left).toBe(730)
  })
})
