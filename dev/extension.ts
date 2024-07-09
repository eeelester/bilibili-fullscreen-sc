import { resolve } from 'node:path'
import { launch } from 'puppeteer'

async function start() {
  const extensionPath = resolve(__dirname, '../dist') // 插件路径
  const browser = await launch({
    defaultViewport: { width: 1920, height: 1080 },
    headless: false, // 需要配置有头模式，无头模式找不到 service worker
    args: [
      // 除了 extensionPath 的插件都禁用掉，避免测试被影响
      `--disable-extensions-except=${extensionPath}`,
      // 安装插件
      `--load-extension=${extensionPath}`,
      '--start-maximized',
    ],
  })
  const page = await browser.newPage()
  await page.goto('https://live.bilibili.com/7777')
}

void start()
