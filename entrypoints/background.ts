import { isEnsureFullscreenRuntimeMessage } from './fullScreen.content/runtimeBridge'

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message: unknown, sender, sendResponse) => {
    if (!isEnsureFullscreenRuntimeMessage(message) || !sender.tab?.id)
      return undefined

    void browser.scripting.executeScript({
      target: {
        tabId: sender.tab.id,
        frameIds: [sender.frameId ?? 0],
      },
      files: ['content-scripts/fullScreenRuntime.js'],
    }).then(() => {
      sendResponse({ ok: true })
    }).catch((error) => {
      console.error('注入全屏 SC Runtime 失败:', error)
      sendResponse({ ok: false })
    })

    return true
  })
})
