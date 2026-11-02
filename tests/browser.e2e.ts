import { launch } from 'puppeteer'
import type { Browser, Page } from 'puppeteer'
import { resolve } from 'node:path'
import { testData } from './testData'

const extensionPath = resolve(__dirname, '../.output/chrome-mv3')
const html = (iframe: boolean) => `<!doctype html><html><head><style>
body{margin:0}#player{width:900px;height:500px;position:relative;background:#222}
video,iframe{width:100%;height:100%;display:block;border:0}
.controls{position:absolute;right:0;top:0;z-index:10000}
</style></head><body><div id="player">
${iframe ? '<iframe allowfullscreen src="/player.html"></iframe>' : '<video></video>'}
<div class="controls"><button id="web">web</button><button id="native">native</button></div>
</div><script>
let web=false;
document.querySelector('#web').onclick=()=>{
 web=!web;
 const player=document.querySelector('#player');
 player.style.width=web?'100vw':'900px';player.style.height=web?'100vh':'500px';
};
document.querySelector('#native').onclick=()=>document.querySelector('#player').requestFullscreen();
</script></body></html>`

describe('built extension browser regression', () => {
  let browser: Browser
  const pages: Page[] = []
  const errors: string[] = []
  const recordError = (error: unknown) => errors.push(error instanceof Error ? error.message : String(error))
  beforeAll(async () => {
    browser = await launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      channel: process.env.PUPPETEER_EXECUTABLE_PATH ? undefined : 'chrome',
      enableExtensions: true,
      pipe: true,
      defaultViewport: { width: 1280, height: 900 },
      args: ['--no-sandbox'],
    })
    await browser.installExtension(extensionPath)
  })
  afterAll(async () => { await browser?.close() })
  afterEach(async () => {
    await Promise.all(pages.splice(0).map(page => page.close()))
    expect(errors.splice(0)).toEqual([])
  })

  async function room(options: { iframe?: boolean, seconds?: number } = {}) {
    const page = await browser.newPage()
    page.setDefaultTimeout(10_000)
    pages.push(page)
    page.on('pageerror', recordError)
    const cdp = await page.target().createCDPSession()
    await cdp.send('Network.enable')
    await cdp.send('Network.setBlockedURLs', { urls: ['*broadcastlv.chat.bilibili.com*'] })
    await page.setRequestInterception(true)
    let roomRequests = 0
    const requestedRooms: string[] = []
    page.on('request', (request) => {
      const url = request.url()
      if (url.startsWith('chrome-extension:')) {
        void request.continue()
        return
      }
      let body: unknown
      if (url.includes('/room/v1/Room/get_info')) {
        roomRequests++
        const roomId = new URL(url).searchParams.get('room_id')!
        requestedRooms.push(roomId)
        body = { room_id: Number(roomId) }
      }
      else if (url.includes('getInfoByRoom')) {
        const seconds = options.seconds || 60
        const message = { ...testData.data, id: 111, time: seconds, start_time: 100, end_time: 100 + seconds, message: 'SC regression fixture' }
        body = { super_chat_info: { message_list: [null, message, message] } }
      }
      else if (url.includes('/x/member/web/account')) {
        body = { mid: 42 }
      }
      else if (url.includes('/x/web-interface/nav')) {
        body = { wbi_img: {
          img_url: 'https://i0.hdslb.com/bfs/wbi/7cd084941338484aae1ad9425b84077c.png',
          sub_url: 'https://i0.hdslb.com/bfs/wbi/4932caff0ff746eab6f01bf08b70ac45.png',
        } }
      }
      else if (url.includes('getDanmuInfo')) {
        body = { token: 'fixture-token' }
      }
      if (body !== undefined) {
        void request.respond({ status: 200, contentType: 'application/json', headers: {
          'Access-Control-Allow-Origin': 'https://live.bilibili.com',
          'Access-Control-Allow-Credentials': 'true',
        }, body: JSON.stringify({ code: 0, data: body }) })
      }
      else if (request.isNavigationRequest() && url.startsWith('https://live.bilibili.com/')) {
        const content = url.includes('/player')
          ? '<!doctype html><html><head><style>body{margin:0}video{display:block;width:100vw;height:100vh}</style></head><body></body></html>'
          : html(Boolean(options.iframe))
        void request.respond({ status: 200, contentType: 'text/html', body: content })
      }
      else {
        void request.abort()
      }
    })
    await page.goto('https://live.bilibili.com/7777', { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('#web')
    return { page, roomRequests: () => roomRequests, requestedRooms }
  }
  const settle = (page: Page) => page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))

  it('keeps a single SC through native/web fullscreen transitions and repeated entry', async () => {
    const { page } = await room()
    expect(await page.$('.sc')).toBeNull()
    await page.click('#web')
    await page.waitForSelector('.sc')
    expect(await page.$$eval('.sc', nodes => nodes.length)).toBe(1)
    await page.click('#native')
    await page.waitForFunction(() => Boolean(document.fullscreenElement))
    await page.evaluate(() => document.exitFullscreen())
    await page.waitForFunction(() => !document.fullscreenElement)
    await settle(page)
    expect(await page.$$eval('.sc', nodes => nodes.length)).toBe(1)
    await page.click('#web')
    await page.waitForFunction(() => !document.querySelector('[data-bilibili-fullscreen-sc]'))
    for (let i = 0; i < 3; i++) {
      await page.click('#web')
      await page.waitForSelector('.sc')
      expect(await page.$$eval('[data-bilibili-fullscreen-sc]', nodes => nodes.length)).toBe(1)
      await page.click('#web')
      await page.waitForFunction(() => !document.querySelector('[data-bilibili-fullscreen-sc]'))
    }
  })

  it('moves the existing overlay into replacement player containers without reconnecting', async () => {
    const { page, roomRequests } = await room()
    await page.click('#web')
    await page.waitForSelector('.sc')
    await page.evaluate(() => {
      const overlay = document.querySelector<HTMLElement>('[data-bilibili-fullscreen-sc]')!
      overlay.dataset.probe = 'retained'
      const player = document.querySelector<HTMLElement>('#player')!
      const replacement = document.createElement('div')
      replacement.id = 'player'
      replacement.style.cssText = player.style.cssText
      replacement.appendChild(document.createElement('video'))
      player.replaceWith(replacement)
    })
    await page.waitForFunction(() => Boolean(document.querySelector('#player > [data-probe="retained"] .sc')))
    expect(roomRequests()).toBe(1)
    await page.evaluate(() => { document.querySelector<HTMLElement>('#player')!.style.width = '900px' })
    await page.waitForFunction(() => !document.querySelector('[data-bilibili-fullscreen-sc]'))
  })

  it('supports native fullscreen on its own and clears the overlay on exit', async () => {
    const { page } = await room()
    await page.click('#native')
    await page.waitForSelector('.sc')
    await page.evaluate(() => document.exitFullscreen())
    await page.waitForFunction(() => !document.querySelector('[data-bilibili-fullscreen-sc]'))
  })

  it('reinitializes the connection when navigating to a different room in the same document', async () => {
    const { page, requestedRooms } = await room()
    await page.click('#web')
    await page.waitForSelector('.sc')
    await page.evaluate(() => {
      document.querySelector<HTMLElement>('[data-bilibili-fullscreen-sc]')!.dataset.probe = 'old-room'
      history.pushState({}, '', '/8888')
    })
    await page.waitForFunction(() => !document.querySelector('[data-probe="old-room"]') && Boolean(document.querySelector('.sc')))
    expect(requestedRooms).toEqual(['7777', '8888'])
  })

  it('handles delayed iframe videos, iframe reloads, and scoped stylesheet injection', async () => {
    const { page } = await room({ iframe: true })
    await page.waitForSelector('iframe')
    const iframe = await (await page.$('iframe'))!.contentFrame()
    await iframe!.evaluate(() => document.body.appendChild(document.createElement('video')))
    await page.click('#web')
    await iframe!.waitForSelector('.sc')
    expect(await iframe!.$$eval('link[data-bilibili-fullscreen-sc]', nodes => nodes.length)).toBe(1)
    expect(await iframe!.$eval('.sc-list', element => getComputedStyle(element).position)).toBe('fixed')
    await page.evaluate(() => { document.querySelector<HTMLIFrameElement>('iframe')!.src = '/player-replaced.html' })
    await page.waitForFunction(() => Boolean(document.querySelector<HTMLIFrameElement>('iframe')?.contentDocument?.body))
    const reloaded = await (await page.$('iframe'))!.contentFrame()
    await reloaded!.waitForFunction(() => location.pathname === '/player-replaced.html')
    await reloaded!.evaluate(() => document.body.appendChild(document.createElement('video')))
    await reloaded!.waitForSelector('.sc')
    expect(await reloaded!.$$eval('link[data-bilibili-fullscreen-sc]', nodes => nodes.length)).toBe(1)
  })

  it('expires messages after their remaining lifetime', async () => {
    const { page } = await room({ seconds: 1 })
    await page.click('#web')
    await page.waitForSelector('.sc')
    await page.waitForSelector('.sc', { hidden: true })
  })

  it('preserves deletion across full screen remounts', async () => {
    const { page } = await room()
    await page.click('#web')
    await page.waitForSelector('.sc')
    await page.click('.close-btn')
    await page.waitForSelector('.sc', { hidden: true })
    await page.click('#web')
    await page.waitForFunction(() => !document.querySelector('[data-bilibili-fullscreen-sc]'))
    const history = page.waitForResponse(response => response.url().includes('getInfoByRoom'))
    await page.click('#web')
    await history
    await settle(page)
    expect(await page.$('.sc')).toBeNull()
  })

  it('supports the first drag movement, clamps off-screen dragging, and synchronizes settings', async () => {
    const { page } = await room({ iframe: true })
    const iframe = await (await page.$('iframe'))!.contentFrame()
    await iframe!.evaluate(() => document.body.appendChild(document.createElement('video')))
    await page.click('#web')
    await iframe!.waitForSelector('.sc')
    const origin = await iframe!.$eval('link[data-bilibili-fullscreen-sc]', element => new URL((element as HTMLLinkElement).href).origin)
    const popup = await browser.newPage()
    pages.push(popup)
    popup.on('pageerror', recordError)
    await popup.goto(`${origin}/popup.html`)
    await popup.waitForSelector('.sc')
    expect(await popup.$$eval('.sc', nodes => nodes.length)).toBe(1)
    await popup.select('.position-select', 'top-left')
    await popup.click('input#max')
    await iframe!.waitForSelector('.container.max')
    await iframe!.waitForFunction(() => document.querySelector<HTMLElement>('.sc-list')?.style.top === '10px')
    await popup.focus('input#max')
    await popup.keyboard.press('ArrowDown')
    await iframe!.waitForSelector('.container.medium')
    await popup.click('input#max')
    await iframe!.waitForSelector('.container.max')
    await page.bringToFront()
    const sc = await iframe!.$('.top-container')
    const box = await sc!.boundingBox()
    await page.mouse.move(box!.x + 100, box!.y + 15)
    await page.mouse.down()
    await page.mouse.move(box!.x + 120, box!.y + 35)
    await page.mouse.up()
    await iframe!.waitForFunction(() => document.querySelector<HTMLElement>('.sc-list')?.style.left === '30px')
    await page.mouse.move(box!.x + 120, box!.y + 35)
    await page.mouse.down()
    await page.mouse.move(-1000, -1000)
    await page.mouse.up()
    await iframe!.waitForFunction(() => document.querySelector<HTMLElement>('.sc-list')?.style.left === '0px')
  })
})
