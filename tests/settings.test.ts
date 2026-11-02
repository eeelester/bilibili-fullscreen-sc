import { DEFAULT_SIZE, PositionEnum, sizeEnum } from '../constant'
import { getUiSettings, normalizePosition, normalizeSize, watchUiSettings } from '../utils/settings'
import { storage } from 'wxt/utils/storage'

jest.mock('wxt/utils/storage', () => ({
  storage: { getItem: jest.fn(), watch: jest.fn() },
}))

describe('UI settings compatibility', () => {
  it('keeps existing storage keys and enum values', async () => {
    jest.mocked(storage.getItem).mockImplementation(async (key) => key === 'local:UISize' ? sizeEnum.max : PositionEnum.TOP_RIGHT)
    await expect(getUiSettings()).resolves.toEqual({ size: 'max', position: 'top-right' })
  })
  it('normalizes absent or invalid stored values', () => {
    expect(normalizeSize('unknown')).toBe(DEFAULT_SIZE)
    expect(normalizePosition(null)).toBe(PositionEnum.BOTTOM_LEFT)
  })
  it('watches both settings and releases both listeners', () => {
    const cleanups = [jest.fn(), jest.fn()]
    jest.mocked(storage.watch).mockReturnValueOnce(cleanups[0]).mockReturnValueOnce(cleanups[1])
    const stop = watchUiSettings(jest.fn(), jest.fn())
    stop()
    expect(cleanups[0]).toHaveBeenCalledTimes(1)
    expect(cleanups[1]).toHaveBeenCalledTimes(1)
  })
})
