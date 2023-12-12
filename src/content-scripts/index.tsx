/* eslint-disable no-console */

import type { Root } from 'react-dom/client'
import { createRoot } from 'react-dom/client'
import { LiveWS } from 'bilibili-live-ws'
import SCList from '../components/ScList'
import { eventBus } from '@/utils/event'
import { MATCH_URL, WS_SC_EVENT } from '@/constant'

((document, chrome) => {
  let existElement: HTMLElement | null
  let root: Root | null
  let liveWS: LiveWS | null
  let switchState: boolean = true
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
      document.querySelector('#live-player')?.appendChild(existElement)

      root = createRoot(existElement)
      root.render(<SCList />)

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

    liveWS = new LiveWS(roomId, {
      protover: 3,
    })
    liveWS.on('SUPER_CHAT_MESSAGE', (res) => {
      console.log('SC', res)
      processData(res)
    })
  }

  function processData(res) {
    // eslint-disable-next-line ts/no-unsafe-assignment
    const {
      data: {
        user_info: {
          face,
          face_frame,
          uname,
          name_color,
        },
        price,
        message,
        message_font_color,
        background_bottom_color,
        background_color,
        time,
        id,
      },
    }: {
      data: {
        user_info: {
          face: ''
          face_frame: ''
          uname: ''
          name_color: ''
        }
        price: 0
        message: ''
        message_font_color: ''
        background_bottom_color: ''
        background_color: ''
        time: 0
        id: 0
      }
    } = res

    eventBus.emit(WS_SC_EVENT, {
      face,
      face_frame,
      uname,
      name_color,
      price,
      message,
      message_font_color,
      background_bottom_color,
      background_color,
      time,
      id,
    })
  }

  // 监听popup信息
  chrome.runtime.onMessage.addListener((request: { switchState: boolean }, _, sendResponse) => {
    switchState = request.switchState
    sendResponse('content got!')
  })
})(document, chrome)
