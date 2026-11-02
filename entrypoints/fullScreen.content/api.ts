interface ApiResponse {
  code?: number
  message?: string
  msg?: string
}

export async function fetchJson<T extends ApiResponse>(input: string, init: RequestInit = {}, allowedCodes: number[] = []): Promise<T> {
  const controller = new AbortController()
  const abort = () => controller.abort()
  init.signal?.addEventListener('abort', abort, { once: true })
  if (init.signal?.aborted)
    controller.abort()
  const timeout = setTimeout(abort, 15_000)
  try {
    const response = await fetch(input, { ...init, signal: controller.signal })
    if (!response.ok)
      throw new Error(`Request failed: ${response.status} ${response.statusText}`)
    const result = await response.json() as T
    if (!result || typeof result !== 'object')
      throw new Error('Invalid API response')
    if (typeof result.code === 'number' && result.code !== 0 && !allowedCodes.includes(result.code))
      throw new Error(`API error ${result.code}: ${result.message || result.msg || ''}`)
    return result
  }
  finally {
    clearTimeout(timeout)
    init.signal?.removeEventListener('abort', abort)
  }
}
