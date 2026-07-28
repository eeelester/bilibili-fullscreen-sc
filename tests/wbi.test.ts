import { encWbi } from '@/entrypoints/fullScreen.content/wbi'

describe('WBI signing', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('sorts and filters parameters without mutating the input', () => {
    jest.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000)
    const params = { z: 'a!\'()*b', id: 7777 }
    const snapshot = { ...params }

    const query = encWbi(
      params,
      '7cd084941338484aae1ad9425b84077c',
      '4932caff0ff746eab6f01bf08b70ac45',
    )

    expect(params).toEqual(snapshot)
    expect(query).toMatch(/^id=7777&wts=1700000000&z=ab&w_rid=[a-f0-9]{32}$/)
  })
})
