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

  /**
   * 监听全屏模式事件
   */
  // window.addEventListener('resize',() => {
  //   // 获取滚动条宽度
  //   const cWidth = document.body.clientWidth || document.documentElement.clientWidth; //页面可视区域宽度
  //   const iWidth = window.innerWidth;// 页面宽度（与浏览器宽度window.outerwidth不同的是，window.outerwidth包含控制台等）
  //   const srollbarWidth = iWidth - cWidth
  //   if(window.outerWidth - window.innerWidth)
  //   console.log(iWidth - cWidth);//打印滚动条宽度
  // })

  /**
   * 监听fullscreenchange事件
   */
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
        // react卸载
        root?.unmount()
        root = null
        // 移除dom
        existElement?.parentNode?.removeChild(existElement)
        existElement = null
        // 关闭websocket
        liveWS?.close()
        liveWS = null
        console.log('------全屏退出，清除完毕------')
        return
      }

      console.log('------进入全屏，bilibili-fullscreen-sc启动------')

      existElement = document.createElement('div')
      // [].filter.call(document.querySelectorAll('iframe'),item=>item.contentDocument)[0].contentDocument.
      // document.querySelector('#live-player')?.appendChild(existElement)
      document.documentElement.appendChild(existElement)

      root = createRoot(existElement)
      root.render(<SCList />)

      // setTimeout(() => {
      //   processData(testData as DanmuDataProps)
      // }, 5000)

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
    console.log('key', key)
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
