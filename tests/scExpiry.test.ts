import type { ScInfo } from '@/components/ScList/type'
import { getDisplayDurationMs, removeExpiredSc } from '@/components/ScList/hook'

describe('SC expiry', () => {
  it('accounts for an existing SC delay', () => {
    expect(getDisplayDurationMs({ time: 60, delay: 15 })).toBe(45_000)
  })

  it('keeps the original array when nothing expired', () => {
    const list = [createScInfo({ addedTime: 1_000, time: 60 })]
    expect(removeExpiredSc(list, 10_000)).toBe(list)
  })

  it('removes expired SC items without a frame loop', () => {
    const active = createScInfo({ id: 1, addedTime: 50_000, time: 60 })
    const expired = createScInfo({ id: 2, addedTime: 1_000, time: 10 })

    expect(removeExpiredSc([active, expired], 60_000)).toEqual([active])
  })
})

function createScInfo(overrides: Partial<ScInfo>): ScInfo {
  return {
    face: '',
    face_frame: '',
    uname: '',
    name_color: '#333333',
    price: 0,
    message: '',
    message_font_color: '#FFFFFF',
    background_bottom_color: '#000000',
    background_color: '#FFFFFF',
    id: 1,
    time: 60,
    delay: 0,
    nodeRef: { current: null },
    addedTime: 0,
    ...overrides,
  }
}
