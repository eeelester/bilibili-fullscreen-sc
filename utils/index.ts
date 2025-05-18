import { eventBus } from '@/utils/event'
import type { sizeEnum } from '@/constant'
import { SIZE_EVENT, WS_SC_EVENT, POSITION_EVENT, PositionEnum } from '@/constant'

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
    delay: number // existing sc的属性
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
      delay = 0,
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
    delay,
  })
}

function processSize(size: sizeEnum) {
  eventBus.emit(SIZE_EVENT, size)
}

function processPosition(position: PositionEnum) {
  eventBus.emit(POSITION_EVENT, position)
}

export { processData, processSize, processPosition }
