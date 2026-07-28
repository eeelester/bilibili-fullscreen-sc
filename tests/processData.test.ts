import { WS_SC_EVENT } from '@/constant'
import { createSuperChatFixture, superChatFixture } from '@/fixtures/superChat'
import { processData } from '@/utils'
import { eventBus } from '@/utils/event'

describe('processData', () => {
  it('emits normalized super chat data', () => {
    const listener = jest.fn()
    eventBus.subscribe(WS_SC_EVENT, listener)

    processData(superChatFixture)

    expect(listener).toHaveBeenCalledWith({
      face: superChatFixture.data.user_info.face,
      face_frame: superChatFixture.data.user_info.face_frame,
      uname: superChatFixture.data.user_info.uname,
      name_color: superChatFixture.data.user_info.name_color,
      price: superChatFixture.data.price,
      message: superChatFixture.data.message,
      message_font_color: superChatFixture.data.message_font_color,
      background_bottom_color: superChatFixture.data.background_bottom_color,
      background_color: superChatFixture.data.background_color,
      time: superChatFixture.data.time,
      id: superChatFixture.data.id,
      delay: 0,
    })

    eventBus.unsubscribe(WS_SC_EVENT, listener)
  })

  it('emits a readable username color when upstream colors have low contrast', () => {
    const listener = jest.fn()
    eventBus.subscribe(WS_SC_EVENT, listener)

    processData(createSuperChatFixture({
      background_color: '#FFF1C5',
      user_info: {
        ...superChatFixture.data.user_info,
        name_color: '#00D1F1',
      },
    }))

    expect(listener).toHaveBeenCalledWith(expect.objectContaining({
      name_color: '#333333',
    }))

    eventBus.unsubscribe(WS_SC_EVENT, listener)
  })

  it('rejects invalid IDs and durations', () => {
    const listener = jest.fn()
    eventBus.subscribe(WS_SC_EVENT, listener)

    expect(processData(createSuperChatFixture({ id: 0 }))).toBe(false)
    expect(processData(createSuperChatFixture({ time: Number.NaN }))).toBe(false)
    expect(listener).not.toHaveBeenCalled()

    eventBus.unsubscribe(WS_SC_EVENT, listener)
  })

  it('bounds text and rejects unsafe image URLs', () => {
    const listener = jest.fn()
    eventBus.subscribe(WS_SC_EVENT, listener)

    processData(createSuperChatFixture({
      message: 'x'.repeat(600),
      user_info: {
        ...superChatFixture.data.user_info,
        face: 'javascript:alert(1)',
      },
    }))

    expect(listener).toHaveBeenCalledWith(expect.objectContaining({
      face: '',
      message: 'x'.repeat(500),
    }))

    eventBus.unsubscribe(WS_SC_EVENT, listener)
  })
})
