import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { runInNewContext } from 'node:vm'

const script = readFileSync(resolve(__dirname, '../public/bilibili-web-show-ip-location.user.js'), 'utf8')

function setup() {
  const registry = new Map<string, unknown>()
  const inserted: { textContent?: string, id?: string }[] = []
  const pubdate = { insertAdjacentElement: (_position: string, node: any) => { inserted.push(node) } }
  class Renderer {
    data = { reply_control: { location: 'IP属地：中国' } }
    shadowRoot = {
      querySelector: (selector: string) => selector === '#pubdate' ? pubdate : inserted[0],
      querySelectorAll: () => [],
    }
    update() {}
    requestUpdate() { this.update() }
  }
  const element = new Renderer()
  const document = {
    documentElement: {},
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: () => ({}),
  }
  const location = { href: 'https://www.bilibili.com/video/BV1' }
  const customElements = {
    get: (name: string) => registry.get(name),
    define: (name: string, constructor: unknown) => { registry.set(name, constructor) },
  }
  const window = Object.assign(new EventTarget(), { customElements, Proxy })
  runInNewContext(script, {
    unsafeWindow: window, window, document, location, URL, Proxy,
  })
  return { Renderer, element, inserted, customElements }
}

describe('IP location compatibility', () => {
  it('patches future custom element registration and updates location without duplication', () => {
    const page = setup()
    page.customElements.define('bili-comment-action-buttons-renderer', page.Renderer)
    page.element.update()
    page.element.data.reply_control.location = 'IP属地：上海'
    page.element.update()
    expect(page.inserted).toEqual([{ id: 'location', textContent: 'IP属地：上海' }])
  })
})
