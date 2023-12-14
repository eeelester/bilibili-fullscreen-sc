import { eventBus } from '@/utils/event'
import { WS_SC_EVENT } from '@/constant'

/**
 * @description: 更改icon图标，根据state改为able和disable
 * @param {boolean} switchState
 * @return {*}
 */
function changeIcon(switchState: boolean) {
  if (switchState) {
    void chrome.action.setIcon({
      path: {
        16: '/icons/icon-able-16.png',
        32: '/icons/icon-able-32.png',
        48: '/icons/icon-able-48.png',
      },
    })
  }
  else {
    void chrome.action.setIcon({
      path: {
        16: '/icons/icon-16.png',
        32: '/icons/icon-32.png',
        48: '/icons/icon-48.png',
      },
    })
  }
}

export interface DanmuDataProps {
  data: {
    user_info: {
      face: string
      face_frame: string
      uname: string
      name_color: string
    }
    price: number
    message: string
    message_font_color: string
    background_bottom_color: string
    background_color: string
    time: number
    id: number
  }
  [propNames: string]: any
}
/**
 * @description: 处理SC数据
 * @param {DanmuDataProps} res
 * @return {*}
 */
function processData(res: DanmuDataProps) {
  const {
    data: {
      user_info: {
        face = '',
        face_frame = '',
        uname = '',
        name_color = '',
      },
      price = 0,
      message = '',
      message_font_color = '',
      background_bottom_color = '',
      background_color = '',
      time = 0,
      id = 0,
    },
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

export { changeIcon, processData }
