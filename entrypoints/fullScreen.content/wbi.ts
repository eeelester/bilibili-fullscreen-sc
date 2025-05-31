import md5 from 'md5'

const mixinKeyEncTab: number[] = [
  46,
  47,
  18,
  2,
  53,
  8,
  23,
  32,
  15,
  50,
  10,
  31,
  58,
  3,
  45,
  35,
  27,
  43,
  5,
  49,
  33,
  9,
  42,
  19,
  29,
  28,
  14,
  39,
  12,
  38,
  41,
  13,
  37,
  48,
  7,
  16,
  24,
  55,
  40,
  61,
  26,
  17,
  0,
  1,
  60,
  51,
  30,
  4,
  22,
  25,
  54,
  21,
  56,
  59,
  6,
  63,
  57,
  62,
  11,
  36,
  20,
  34,
  44,
  52,
]

// 对 imgKey 和 subKey 进行字符顺序打乱编码
const getMixinKey = (orig: string): string => mixinKeyEncTab.map(n => orig[n]).join('').slice(0, 32)

// WBI 签名参数接口
interface WbiParams {
  [key: string]: string | number
}

// B站 API 响应接口
interface BilibiliNavResponse {
  code: number
  message: string
  ttl: number
  data: {
    wbi_img: {
      img_url: string
      sub_url: string
    }
    // 其他字段可以根据需要添加
  }
}

// WBI 密钥接口
interface WbiKeys {
  img_key: string
  sub_key: string
}

// 为请求参数进行 wbi 签名
function encWbi(params: WbiParams, img_key: string, sub_key: string): string {
  const mixin_key = getMixinKey(img_key + sub_key)
  const curr_time = Math.round(Date.now() / 1000)
  const chr_filter = /[!'()*]/g

  Object.assign(params, { wts: curr_time }) // 添加 wts 字段
  // 按照 key 重排参数
  const query = Object
    .keys(params)
    .sort()
    .map((key) => {
      // 过滤 value 中的 "!'()*" 字符
      const value = params[key].toString().replace(chr_filter, '')
      return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
    })
    .join('&')

  const wbi_sign = md5(query + mixin_key) // 计算 w_rid

  return `${query}&w_rid=${wbi_sign}`
}

// 获取最新的 img_key 和 sub_key
async function getWbiKeys(): Promise<WbiKeys> {
  const res = await fetch('https://api.bilibili.com/x/web-interface/nav', {
    credentials: 'include',
  })
  const data = await res.json() as BilibiliNavResponse
  const { data: { wbi_img: { img_url, sub_url } } } = data

  return {
    img_key: img_url.slice(
      img_url.lastIndexOf('/') + 1,
      img_url.lastIndexOf('.'),
    ),
    sub_key: sub_url.slice(
      sub_url.lastIndexOf('/') + 1,
      sub_url.lastIndexOf('.'),
    ),
  }
}

export async function wbi(params: WbiParams): Promise<string> {
  const web_keys = await getWbiKeys()
  const img_key = web_keys.img_key
  const sub_key = web_keys.sub_key
  const query = encWbi(params, img_key, sub_key)
  console.log('wbi', query)
  return query
}
