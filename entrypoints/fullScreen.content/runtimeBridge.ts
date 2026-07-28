import type { FullscreenMode } from './fullscreenState'

const FULLSCREEN_RUNTIME_EVENT = 'bilibili-fullscreen-sc:fullscreen-change'
const ENSURE_FULLSCREEN_RUNTIME_MESSAGE = 'bilibili-fullscreen-sc:ensure-runtime'

interface FullscreenRuntimeEventDetail {
  mode: FullscreenMode
}

interface EnsureFullscreenRuntimeMessage {
  type: typeof ENSURE_FULLSCREEN_RUNTIME_MESSAGE
}

interface EnsureFullscreenRuntimeResponse {
  ok: boolean
}

function dispatchFullscreenRuntimeEvent(mode: FullscreenMode) {
  document.dispatchEvent(new CustomEvent<FullscreenRuntimeEventDetail>(FULLSCREEN_RUNTIME_EVENT, {
    detail: { mode },
  }))
}

function isEnsureFullscreenRuntimeMessage(message: unknown): message is EnsureFullscreenRuntimeMessage {
  return Boolean(
    message
    && typeof message === 'object'
    && 'type' in message
    && message.type === ENSURE_FULLSCREEN_RUNTIME_MESSAGE,
  )
}

function isEnsureFullscreenRuntimeResponse(response: unknown): response is EnsureFullscreenRuntimeResponse {
  return Boolean(
    response
    && typeof response === 'object'
    && 'ok' in response
    && typeof response.ok === 'boolean',
  )
}

export type { EnsureFullscreenRuntimeMessage, EnsureFullscreenRuntimeResponse, FullscreenRuntimeEventDetail }
export {
  dispatchFullscreenRuntimeEvent,
  ENSURE_FULLSCREEN_RUNTIME_MESSAGE,
  FULLSCREEN_RUNTIME_EVENT,
  isEnsureFullscreenRuntimeMessage,
  isEnsureFullscreenRuntimeResponse,
}
