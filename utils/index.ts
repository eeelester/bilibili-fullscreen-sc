import { WS_SC_EVENT } from '@/constant'
import { getReadableTextColor } from '@/utils/color'
import { eventBus } from '@/utils/event'

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
  [propNames: string]: unknown
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

  const normalizedId = normalizePositiveNumber(id)
  const normalizedTime = normalizePositiveNumber(time)
  if (!normalizedId || !normalizedTime)
    return false

  const normalizedBackgroundColor = normalizeColor(background_color, '#EDF5FF')
  const normalizedBackgroundBottomColor = normalizeColor(background_bottom_color, '#2A60B2')
  const boundedTime = Math.min(normalizedTime, 86_400)
  const normalizedDelay = Math.min(Math.max(0, normalizeFiniteNumber(delay)), boundedTime)

  eventBus.emit(WS_SC_EVENT, {
    face: normalizeImageUrl(face),
    face_frame: normalizeImageUrl(face_frame),
    uname: normalizeText(uname, 80),
    name_color: getReadableTextColor(normalizeColor(name_color, '#333333'), normalizedBackgroundColor),
    price: Math.max(0, normalizeFiniteNumber(price)),
    message: normalizeText(message, 500),
    message_font_color: getReadableTextColor(normalizeColor(message_font_color, '#FFFFFF'), normalizedBackgroundBottomColor),
    background_bottom_color: normalizedBackgroundBottomColor,
    background_color: normalizedBackgroundColor,
    time: boundedTime,
    id: normalizedId,
    delay: normalizedDelay,
  })

  return true
}

function normalizeFiniteNumber(value: unknown) {
  const number = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(number) ? number : 0
}

function normalizePositiveNumber(value: unknown) {
  const number = normalizeFiniteNumber(value)
  return number > 0 ? number : 0
}

function normalizeText(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.slice(0, maxLength) : ''
}

function normalizeColor(value: unknown, fallback: string) {
  if (typeof value !== 'string')
    return fallback

  return /^#[\da-f]{3}(?:[\da-f]{3})?$/i.test(value.trim()) ? value.trim() : fallback
}

function normalizeImageUrl(value: unknown) {
  if (typeof value !== 'string' || !value)
    return ''

  try {
    const url = new URL(value, 'https://www.bilibili.com')
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : ''
  }
  catch {
    return ''
  }
}

export { processData }
