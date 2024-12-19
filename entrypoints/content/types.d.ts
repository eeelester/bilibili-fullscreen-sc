import type { DanmuDataProps } from '@/utils'

interface BilibiliResponseBasic {
  code: number
  message: string
  msg: string
  ttl: number
}

export interface RoomInfo extends BilibiliResponseBasic {
  data: {
    room_id: number
  }
}

type DanmuData = Pick<DanmuDataProps, 'data'>['data']
interface MessageList extends DanmuData {
  time: number
  start_time: number
  end_time: number
}

export interface RoomDetailInfo extends BilibiliResponseBasic {
  data: {
    super_chat_info: {
      message_list: MessageList[]
    }
  }
}

export interface DanmuInfo extends BilibiliResponseBasic {
  data: {
    token: string
  }
}

export type Status = 'active' | 'inactive' | 'pending'
