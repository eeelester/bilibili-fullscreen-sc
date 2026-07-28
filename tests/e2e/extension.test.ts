import type { Browser, Page } from 'puppeteer'
import { resolve } from 'node:path'
import { launch } from 'puppeteer'

const testPageUrl = 'https://live.bilibili.com/7777'

describe('browser extension', () => {
  let browser: Browser
  let extensionId: string

  beforeAll(async () => {
    const extensionPath = resolve(__dirname, '../../.output/chrome-mv3')
    browser = await launch({
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--no-first-run',
      ],
    })
    extensionId = await findExtensionId(browser)
  }, 30_000)

  afterAll(async () => {
    await browser?.close()
  })

  it('loads the popup and its SC preview', async () => {
    const page = await browser.newPage()
    await page.goto(`chrome-extension://${extensionId}/popup.html`)

    await page.waitForSelector('.popup-wrap')
    await page.waitForSelector('.bfs-sc-list .bfs-sc-card')
    expect(await page.$('.position-select')).not.toBeNull()

    await page.click('#sc-size-max')
    await page.waitForSelector('.popup-wrap.popup-size-max .bfs-sc-root.max')
    const previewBounds = await page.evaluate(() => {
      const popup = document.querySelector('.popup-wrap')?.getBoundingClientRect()
      const card = document.querySelector('.bfs-sc-card')?.getBoundingClientRect()
      return popup && card
        ? { cardRight: card.right, popupRight: popup.right }
        : null
    })
    expect(previewBounds).not.toBeNull()
    expect(previewBounds!.cardRight).toBeLessThanOrEqual(previewBounds!.popupRight)

    await page.click('#sc-size-medium')

    await page.close()
  })

  it('mounts, remounts, and removes SC when page fullscreen changes', async () => {
    const page = await browser.newPage()
    await serveLocalLivePage(page)

    await page.waitForSelector('[data-bilibili-fullscreen-sc-root]', { timeout: 10_000 })
    expect(await page.$$('[data-bilibili-fullscreen-sc-root]')).toHaveLength(1)

    await page.evaluate(() => {
      const previousVideo = document.querySelector('video')
      const replacement = document.createElement('video')
      replacement.id = 'replacement-video'
      replacement.style.width = '100vw'
      replacement.style.height = '60vh'
      previousVideo?.replaceWith(replacement)
    })

    await page.waitForSelector('#replacement-video + [data-bilibili-fullscreen-sc-root]', { timeout: 10_000 })
    expect(await page.$$('[data-bilibili-fullscreen-sc-root]')).toHaveLength(1)

    await page.evaluate(() => {
      const video = document.querySelector('video')
      if (video)
        video.style.width = '320px'
      window.dispatchEvent(new Event('resize'))
    })

    await page.waitForSelector('[data-bilibili-fullscreen-sc-root]', { hidden: true, timeout: 10_000 })
    await page.close()
  })
})

async function serveLocalLivePage(page: Page) {
  await page.setRequestInterception(true)
  page.on('request', (request) => {
    if (request.isNavigationRequest() && request.url() === testPageUrl) {
      void request.respond({
        contentType: 'text/html',
        body: `<!doctype html>
          <html>
            <head><meta charset="utf-8"><title>Local live fixture</title></head>
            <body style="margin: 0">
              <main id="player"><video id="video" style="display: block; width: 100vw; height: 60vh"></video></main>
            </body>
          </html>`,
      })
      return
    }

    void request.abort()
  })

  await page.goto(testPageUrl, { waitUntil: 'domcontentloaded' })
}

async function findExtensionId(browser: Browser) {
  const workerTarget = await browser.waitForTarget(
    target => target.type() === 'service_worker' && target.url().startsWith('chrome-extension://'),
    { timeout: 10_000 },
  )
  const extensionId = new URL(workerTarget.url()).host

  if (!extensionId)
    throw new TypeError('Unable to determine the extension ID')

  return extensionId
}
