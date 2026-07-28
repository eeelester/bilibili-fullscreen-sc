import type { DanmuDataProps } from '@/utils'

const superChatFixture = {
  cmd: 'SUPER_CHAT_MESSAGE',
  data: {
    user_info: {
      face: 'https://i0.hdslb.com/bfs/face/example.jpg',
      face_frame: '',
      uname: '示例用户',
      name_color: '#666666',
    },
    price: 30,
    message: '这是一条用于预览和测试的醒目留言',
    message_font_color: '#FFFFFF',
    background_bottom_color: '#2A60B2',
    background_color: '#EDF5FF',
    time: 60,
    id: 8_553_795,
  },
} satisfies DanmuDataProps

function createSuperChatFixture(overrides: Partial<DanmuDataProps['data']> = {}): DanmuDataProps {
  return {
    ...superChatFixture,
    data: {
      ...superChatFixture.data,
      ...overrides,
      user_info: {
        ...superChatFixture.data.user_info,
        ...overrides.user_info,
      },
    },
  }
}

export { createSuperChatFixture, superChatFixture }
