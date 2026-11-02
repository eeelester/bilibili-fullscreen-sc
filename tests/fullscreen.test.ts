import observePageFullScreen from '../entrypoints/fullScreen.content/observePageFullScreen'
import { getVideoDom, mount, unmount } from '../entrypoints/fullScreen.content/utils'

jest.mock('../entrypoints/fullScreen.content/utils', () => ({
  getVideoDom: jest.fn(), mount: jest.fn(), unmount: jest.fn(),
}))

describe('fullscreen lifecycle', () => {
  let page: EventTarget & { fullscreenElement: object | null, querySelectorAll: jest.Mock }
  let view: EventTarget & { innerWidth: number, requestAnimationFrame: jest.Mock, cancelAnimationFrame: jest.Mock }
  let frames: Map<number, FrameRequestCallback>
  let observers: { callback: () => void, observe: jest.Mock, disconnect: jest.Mock }[]
  let resize: () => void
  let width: number
  let currentVideo: HTMLVideoElement
  let stop: (() => void) | undefined
  const flush = () => {
    const callbacks = [...frames.values()]
    frames.clear()
    callbacks.forEach(callback => callback(0))
  }
  beforeEach(() => {
    frames = new Map()
    observers = []
    let nextFrame = 0
    page = Object.assign(new EventTarget(), { fullscreenElement: null, querySelectorAll: jest.fn(() => []) })
    view = Object.assign(new EventTarget(), {
      innerWidth: 1920,
      requestAnimationFrame: jest.fn(callback => { frames.set(++nextFrame, callback); return nextFrame }),
      cancelAnimationFrame: jest.fn(id => frames.delete(id)),
    })
    Object.assign(globalThis, {
      document: page, window: view,
      ResizeObserver: class {
        constructor(callback: () => void) { resize = callback }
        observe = jest.fn()
        disconnect = jest.fn()
      },
      MutationObserver: class {
        callback: () => void
        observe = jest.fn()
        disconnect = jest.fn()
        constructor(callback: () => void) { this.callback = callback; observers.push(this) }
      },
    })
    width = 1280
    currentVideo = { ownerDocument: page, isConnected: true, getBoundingClientRect: () => ({ width }) } as unknown as HTMLVideoElement
    jest.mocked(getVideoDom).mockImplementation(() => currentVideo)
  })
  afterEach(() => { stop?.(); stop = undefined })

  it('keeps the overlay when leaving native fullscreen while web fullscreen remains active', () => {
    width = 1920
    stop = observePageFullScreen().stop
    flush()
    page.fullscreenElement = {}
    page.dispatchEvent(new Event('fullscreenchange'))
    flush()
    jest.mocked(unmount).mockClear()
    page.fullscreenElement = null
    page.dispatchEvent(new Event('fullscreenchange'))
    flush()
    resize()
    flush()
    expect(unmount).not.toHaveBeenCalled()
    expect(mount).toHaveBeenCalled()
    width = 1280
    resize()
    flush()
    expect(unmount).toHaveBeenCalledTimes(1)
  })

  it('tracks replacement videos and exits web fullscreen normally', () => {
    width = 1920
    stop = observePageFullScreen().stop
    flush()
    currentVideo = { ...currentVideo } as HTMLVideoElement
    observers[0].callback()
    flush()
    jest.mocked(unmount).mockClear()
    width = 1280
    resize()
    flush()
    expect(unmount).toHaveBeenCalledTimes(1)
  })

  it('uses native fullscreen even when the video does not fill the viewport width', () => {
    stop = observePageFullScreen().stop
    flush()
    jest.mocked(mount).mockClear()
    page.fullscreenElement = {}
    page.dispatchEvent(new Event('fullscreenchange'))
    flush()
    expect(mount).toHaveBeenCalledTimes(1)
    page.fullscreenElement = null
    page.dispatchEvent(new Event('fullscreenchange'))
    flush()
    expect(unmount).toHaveBeenCalledTimes(2)
  })

  it('uses layout width when a CSS transform changes the video bounding box', () => {
    currentVideo = { ...currentVideo, clientWidth: 1920 } as HTMLVideoElement
    width = 2100
    stop = observePageFullScreen().stop
    flush()
    expect(mount).toHaveBeenCalledTimes(1)
  })

  it('waits for DOM mutations without continuously scheduling animation frames', () => {
    jest.mocked(getVideoDom).mockReturnValue(undefined)
    stop = observePageFullScreen().stop
    flush()
    expect(frames.size).toBe(0)
    expect(view.requestAnimationFrame).toHaveBeenCalledTimes(1)
    jest.mocked(getVideoDom).mockReturnValue(currentVideo)
    width = 1920
    observers[0].callback()
    observers[0].callback()
    expect(frames.size).toBe(1)
    flush()
    expect(mount).toHaveBeenCalled()
  })

  it('observes delayed videos inside an iframe before any video exists', () => {
    const iframeDocument = Object.assign(new EventTarget(), { fullscreenElement: null })
    const iframe = Object.assign(new EventTarget(), { allowFullscreen: true, contentDocument: iframeDocument })
    page.querySelectorAll.mockReturnValue([iframe])
    jest.mocked(getVideoDom).mockReturnValue(undefined)
    stop = observePageFullScreen().stop
    flush()
    expect(observers).toHaveLength(2)
    currentVideo = { ...currentVideo, ownerDocument: iframeDocument } as unknown as HTMLVideoElement
    jest.mocked(getVideoDom).mockReturnValue(currentVideo)
    width = 1920
    observers[1].callback()
    flush()
    expect(mount).toHaveBeenCalled()
    stop()
    stop = undefined
    expect(observers.every(observer => observer.disconnect.mock.calls.length)).toBe(true)
    page.dispatchEvent(new Event('fullscreenchange'))
    view.dispatchEvent(new Event('resize'))
    iframe.dispatchEvent(new Event('load'))
    expect(frames.size).toBe(0)
  })
})
