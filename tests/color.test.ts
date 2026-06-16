import { getReadableTextColor } from '@/utils/color'

describe('getReadableTextColor', () => {
  it('replaces low-contrast username colors with a readable fallback', () => {
    expect(getReadableTextColor('#00D1F1', '#FFF1C5')).toBe('#333333')
  })
})
