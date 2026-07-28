import type { DanmuDataProps } from '@/utils'

interface BilibiliResponseBasic {
  code: number
  message?: string
  msg?: string
  ttl?: number
}

export interface RoomInfo extends BilibiliResponseBasic {
  data?: {
    room_id?: number
  }
}

type DanmuData = DanmuDataProps['data']
interface MessageList extends DanmuData {
  start_time: number
  end_time: number
}

export interface RoomDetailInfo extends BilibiliResponseBasic {
  data?: {
    super_chat_info?: {
      message_list?: MessageList[]
    }
  }
}

export interface DanmuInfo extends BilibiliResponseBasic {
  data?: {
    token?: string
  }
}
