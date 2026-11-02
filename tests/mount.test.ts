import { createRoot } from 'react-dom/client'
import { mount, unmount, getVideoDom } from '../entrypoints/fullScreen.content/utils'
import { connectRoom } from '../entrypoints/fullScreen.content/liveConnection'

jest.mock('react-dom/client', () => ({ createRoot: jest.fn(() => ({ render: jest.fn(), unmount: jest.fn() })) }))
jest.mock('../components/ScList', () => ({ __esModule: true, default: jest.fn() }))
jest.mock('../entrypoints/fullScreen.content/liveConnection', () => ({ connectRoom: jest.fn(() => jest.fn()) }))

class ElementStub {
  parentElement?: ElementStub
  children: ElementStub[] = []
  dataset: Record<string, string> = {}
  href = ''
  rel = ''
  constructor(public ownerDocument: DocumentStub) {}
  appendChild(child: ElementStub) {
    child.remove()
    this.children.push(child)
    child.parentElement = this
  }
  remove() {
    if (this.parentElement)
      this.parentElement.children = this.parentElement.children.filter(child => child !== this)
    this.parentElement = undefined
  }
}
class DocumentStub {
  head = new ElementStub(this)
  documentElement = this.head
  video?: ElementStub
  iframes: unknown[] = []
  createElement() { return new ElementStub(this) }
  querySelector(selector: string) {
    return selector === 'video' ? this.video : this.head.children.find(child => 'bilibiliFullscreenSc' in child.dataset)
  }
  querySelectorAll() { return this.iframes }
}

describe('overlay mounting', () => {
  let doc: DocumentStub
  beforeEach(() => {
    doc = new DocumentStub()
    Object.assign(globalThis, { document: doc, location: { pathname: '/7777' }, browser: { runtime: { getURL: (path: string) => 'chrome-extension://test' + path } } })
  })
  afterEach(() => unmount())
  const videoIn = (owner: DocumentStub, parent = new ElementStub(owner)) => {
    const video = new ElementStub(owner)
    parent.appendChild(video)
    owner.video = video
    return { video, parent }
  }
  it('does not lock mounting before a video exists', () => {
    mount()
    expect(createRoot).not.toHaveBeenCalled()
    const { parent } = videoIn(doc)
    mount()
    expect(createRoot).toHaveBeenCalledTimes(1)
    expect(parent.children).toHaveLength(2)
  })
  it('relocates an existing overlay and preserves its React root', () => {
    const first = videoIn(doc)
    mount()
    const overlay = first.parent.children[1]
    const next = videoIn(doc)
    mount()
    expect(next.parent.children[1]).toBe(overlay)
    expect(createRoot).toHaveBeenCalledTimes(1)
  })
  it('reinjects iframe CSS per document, without duplicating links', () => {
    const first = new DocumentStub()
    videoIn(first)
    doc.iframes = [{ allowFullscreen: true, contentDocument: first }]
    mount()
    mount()
    expect(first.head.children).toHaveLength(1)
    const second = new DocumentStub()
    videoIn(second)
    doc.iframes = [{ allowFullscreen: true, contentDocument: second }]
    mount()
    expect(second.head.children).toHaveLength(1)
    expect(createRoot).toHaveBeenCalledTimes(2)
  })
  it('skips inaccessible and empty iframes when locating the actual video', () => {
    const iframeDoc = new DocumentStub()
    const { video } = videoIn(iframeDoc)
    doc.iframes = [
      { allowFullscreen: true, get contentDocument() { throw new Error('cross origin') } },
      { allowFullscreen: true, contentDocument: new DocumentStub() },
      { allowFullscreen: true, contentDocument: iframeDoc },
    ]
    expect(getVideoDom()).toBe(video)
  })
  it('starts data delivery only after the list is subscribed and ignores obsolete ready callbacks', () => {
    videoIn(doc)
    mount()
    const root = jest.mocked(createRoot).mock.results[0]!.value
    const ready = root.render.mock.calls[0]![0].props.onReady
    expect(connectRoom).not.toHaveBeenCalled()
    ready()
    expect(connectRoom).toHaveBeenCalledTimes(1)
    const disconnect = jest.mocked(connectRoom).mock.results[0]!.value
    unmount()
    ready()
    expect(disconnect).toHaveBeenCalledTimes(1)
    expect(connectRoom).toHaveBeenCalledTimes(1)
  })

  it('does not initialize an obsolete room while the route is changing', () => {
    videoIn(doc)
    mount()
    const root = jest.mocked(createRoot).mock.results[0]!.value
    const ready = root.render.mock.calls[0]![0].props.onReady
    Object.assign(location, { pathname: '/8888' })
    ready()
    expect(connectRoom).not.toHaveBeenCalled()
    mount()
    const nextRoot = jest.mocked(createRoot).mock.results[1]!.value
    nextRoot.render.mock.calls[0]![0].props.onReady()
    expect(connectRoom).toHaveBeenCalledWith('8888')
  })
})
