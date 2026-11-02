import { eventBus } from '@/utils/event'
import type { PositionEnum, sizeEnum } from '@/constant'
import { POSITION_EVENT, SIZE_EVENT, WS_SC_EVENT } from '@/constant'
import { getReadableTextColor } from '@/utils/color'

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
    delay?: number // existing sc的属性
  }
  [propNames: string]: any
}
/**
 * @description: 处理SC数据
 * @param {DanmuDataProps} res
 * @return {*}
 */
function processData(res: unknown) {
  if (!res || typeof res !== 'object' || !('data' in res) || !res.data || typeof res.data !== 'object')
    return
  const data = res.data as DanmuDataProps['data']
  const messageId = Number(data.id)
  const duration = Number(data.time)
  const elapsed = Math.max(0, Number(data.delay ?? 0))
  if (!Number.isSafeInteger(messageId) || messageId <= 0 || !Number.isFinite(duration) || duration <= 0 || !Number.isFinite(elapsed) || elapsed >= duration)
    return
  const text = (value: unknown) => typeof value === 'string' ? value : ''
  const user = data.user_info || {} as DanmuDataProps['data']['user_info']
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
  } = { data: { ...data, user_info: user } }

  eventBus.emit(WS_SC_EVENT, {
    face: text(face),
    face_frame: text(face_frame),
    uname: text(uname),
    name_color: getReadableTextColor(text(name_color), text(background_color)),
    price: Number.isFinite(Number(price)) ? Number(price) : 0,
    message: text(message),
    message_font_color: text(message_font_color),
    background_bottom_color: text(background_bottom_color),
    background_color: text(background_color),
    time: Number(time),
    id: Number(id),
    delay: Math.max(0, Number(delay)),
  })
}

function processSize(size: sizeEnum) {
  eventBus.emit(SIZE_EVENT, size)
}

function processPosition(position: PositionEnum) {
  eventBus.emit(POSITION_EVENT, position)
}

export { processData, processSize, processPosition }
