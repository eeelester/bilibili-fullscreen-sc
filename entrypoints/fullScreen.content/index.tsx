import { existElement, mount, unmount } from './utils'
import ObservePageFullScreen from './observePageFullScreen'
import { processSize, processPosition } from '@/utils'

export default defineContentScript({
  matches: ['https://live.bilibili.com/*'],
  main() {
    // 监听全屏模式
    document.addEventListener(
      'fullscreenchange',
      () => {
        // 从全屏变为非全屏
        if (!document.fullscreenElement && existElement) {
          unmount('------全屏退出，清除完毕------')
          return
        }

        mount('------进入全屏，bilibili-fullscreen-sc启动------')
      },
      true,
    )

    // 监听网页全屏模式
    ObservePageFullScreen()

    browser.runtime.onMessage.addListener((message) => {
      if (message.size) {
        processSize(message.size)
      }
      if (message.position) {
        processPosition(message.position)
      }
    })
  },
})
