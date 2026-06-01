import { processData } from '@/utils'
import { WS_SC_EVENT } from '@/constant'
import { eventBus } from '@/utils/event'
import { testData } from './testData'

describe('processData', () => {
  it('emits normalized super chat data', () => {
    const listener = jest.fn()
    eventBus.subscribe(WS_SC_EVENT, listener)

    processData(testData)

    expect(listener).toHaveBeenCalledWith({
      face: testData.data.user_info.face,
      face_frame: testData.data.user_info.face_frame,
      uname: testData.data.user_info.uname,
      name_color: testData.data.user_info.name_color,
      price: testData.data.price,
      message: testData.data.message,
      message_font_color: testData.data.message_font_color,
      background_bottom_color: testData.data.background_bottom_color,
      background_color: testData.data.background_color,
      time: testData.data.time,
      id: testData.data.id,
      delay: 0,
    })

    eventBus.unsubscribe(WS_SC_EVENT, listener)
  })
})
