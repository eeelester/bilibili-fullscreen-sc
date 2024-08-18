/* eslint-disable no-console */

import type { Root } from 'react-dom/client'
import { createRoot } from 'react-dom/client'
import { LiveWS } from 'bilibili-live-ws'
import SCList from '../components/ScList'

// import { testData } from '../../dev/testData'
import { processData } from '@/utils'
import type { DanmuDataProps } from '@/utils'
import { MATCH_URL } from '@/constant'

((document, chrome) => {
  let existElement: HTMLElement | null
  let root: Root | null
  let liveWS: LiveWS | null
  let switchState: boolean = true
  document.addEventListener(
    'fullscreenchange',
    () => {
      if (!MATCH_URL.test(location.host))
        return

      // 当用户在popup关闭此功能后
      if (!switchState)
        return

      // 从全屏变为非全屏
      if (!document.fullscreenElement && existElement) {
        root?.unmount()
        root = null
        existElement?.parentNode?.removeChild(existElement)
        existElement = null
        liveWS?.close()
        liveWS = null
        console.log('------全屏退出，清除完毕------')
        return
      }

      console.log('------进入全屏，bilibili-fullscreen-sc启动------')

      existElement = document.createElement('div')
      // 获取跟video的父级dom（B站video的父级dom结构老是变，有病的！）
      const videoParent = document.querySelector('.live-player-mounter');
      const iframe = Array.from(document.querySelectorAll('iframe')).filter(item => item.allowFullscreen)[0];
      const videoParent2 = iframe?.contentDocument?.querySelector('.live-player-mounter');
      (videoParent || videoParent2)?.appendChild(existElement)
      console.log('videoParent',videoParent,videoParent2)

      root = createRoot(existElement)
      root.render(<SCList />)
      // setTimeout(() => {
      //   processData(testData as DanmuDataProps)
      // }, 2000)

      void getInfo()
    },
    true,
  )

  async function getInfo() {
    const shortId = location.pathname.slice(1)
    const roomId = await fetch(`https://api.live.bilibili.com/room/v1/Room/get_info?room_id=${shortId}`)
      .then(response => response.json())
      .then((res) => {
        const { data: { room_id } = { room_id: 0 } } = res as { data: { room_id: number } }
        return room_id
      })

    const key = await fetch(`https://api.live.bilibili.com/xlive/web-room/v1/index/getDanmuInfo?id=${roomId}`)
      .then(response => response.json())
      .then((res) => {
        const { data: { token } = { token: '' } } = res as { data: { token: string } }
        return token
      })
    liveWS = new LiveWS(roomId, {
      protover: 3,
      key,
    })
    liveWS.on('SUPER_CHAT_MESSAGE', (res) => {
      console.log('SC', res)
      processData(res as DanmuDataProps)
    })
  }

  // 监听popup信息
  chrome.runtime.onMessage.addListener((request: { switchState: boolean }, _, sendResponse) => {
    switchState = request.switchState
    sendResponse('content got!')
  })
})(document, chrome)
