import { determineFullscreenMode, FullscreenStateController } from '@/entrypoints/fullScreen.content/fullscreenState'

describe('determineFullscreenMode', () => {
  it('prefers the native fullscreen state', () => {
    expect(determineFullscreenMode({
      hasNativeFullscreen: true,
      videoWidth: 800,
      viewportWidth: 1200,
    })).toBe('native-fullscreen')
  })

  it('detects page fullscreen within a small layout tolerance', () => {
    expect(determineFullscreenMode({
      hasNativeFullscreen: false,
      videoWidth: 1199,
      viewportWidth: 1200,
    })).toBe('page-fullscreen')
  })

  it('keeps normal mode for a regular player', () => {
    expect(determineFullscreenMode({
      hasNativeFullscreen: false,
      videoWidth: 800,
      viewportWidth: 1200,
    })).toBe('normal')
  })
})

describe('FullscreenStateController', () => {
  it('does not repeat side effects while the active target is unchanged', () => {
    const onActivate = jest.fn()
    const onDeactivate = jest.fn()
    const target = { id: 'video-1' }
    const controller = new FullscreenStateController({ onActivate, onDeactivate })

    controller.update('page-fullscreen', target)
    controller.update('native-fullscreen', target)

    expect(onActivate).toHaveBeenCalledTimes(1)
    expect(onDeactivate).not.toHaveBeenCalled()
  })

  it('restarts the active session when Bilibili replaces the video', () => {
    const events: string[] = []
    const firstTarget = { id: 'video-1' }
    const secondTarget = { id: 'video-2' }
    const controller = new FullscreenStateController<{ id: string }>({
      onActivate: target => events.push(`activate:${target.id}`),
      onDeactivate: () => events.push('deactivate'),
    })

    controller.update('page-fullscreen', firstTarget)
    controller.update('page-fullscreen', secondTarget)
    controller.update('normal', secondTarget)

    expect(events).toEqual([
      'activate:video-1',
      'deactivate',
      'activate:video-2',
      'deactivate',
    ])
  })

  it('does not deactivate more than once', () => {
    const onDeactivate = jest.fn()
    const controller = new FullscreenStateController({
      onActivate: jest.fn(),
      onDeactivate,
    })

    controller.update('native-fullscreen', { id: 'video-1' })
    controller.deactivate()
    controller.deactivate()

    expect(onDeactivate).toHaveBeenCalledTimes(1)
  })
})
