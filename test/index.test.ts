import { launch } from 'puppeteer'
import type { Page,Browser } from 'puppeteer'
import { resolve } from 'path'
import { testData } from './testData';
import { describe, expect, it, beforeAll } from '@jest/globals';


describe("bilibili-fullscreen-sc", () => {
  let page: Page
  let browser: Browser

  beforeAll(async () => {
    const extensionPath = resolve(__dirname, '../dist') // 插件路径
    browser = await launch({
      headless: false, // 需要配置有头模式，无头模式找不到 service worker
      args: [
        // 除了 extensionPath 的插件都禁用掉，避免测试被影响
        `--disable-extensions-except=${extensionPath}`,
        // 安装插件
        `--load-extension=${extensionPath}`,
        '--start-maximized'
      ]
    })
    page = await browser.newPage();
    await page.goto("https://live.bilibili.com/6");
  }, 10000);


  it('should show fullscreen sc', async () => {
    await page.waitForSelector('#live-player')
    const isFullScreen = await page.evaluate(async () => {
      await document.querySelector('#live-player')?.requestFullscreen()
      return document.fullscreenElement 
    })
    await expect(isFullScreen).not.toBe(null);

    await page.waitForSelector('.sc-list')
    const scList = await page.$('.sc-list')
    await expect(scList).not.toBe(null);

    // TODO: 模拟websocket返回生成sc组件
    // await page.waitForSelector('.sc')
    // const sc = await page.$('.sc')
    // await expect(sc).not.toBe(null);

  },10000);
});
