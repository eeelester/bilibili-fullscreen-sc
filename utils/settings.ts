import { DEFAULT_SIZE, PositionEnum, sizeEnum } from '@/constant'

const DEFAULT_POSITION = PositionEnum.BOTTOM_LEFT

const uiSizeStorage = storage.defineItem<sizeEnum>('local:UISize', {
  fallback: DEFAULT_SIZE,
})

const uiPositionStorage = storage.defineItem<PositionEnum>('local:UIPosition', {
  fallback: DEFAULT_POSITION,
})

function normalizeSize(value: unknown) {
  switch (value) {
    case sizeEnum.min:
    case sizeEnum.medium:
    case sizeEnum.max:
      return value
    default:
      return DEFAULT_SIZE
  }
}

function normalizePosition(value: unknown) {
  switch (value) {
    case PositionEnum.TOP_LEFT:
    case PositionEnum.TOP_RIGHT:
    case PositionEnum.BOTTOM_LEFT:
    case PositionEnum.BOTTOM_RIGHT:
      return value
    default:
      return DEFAULT_POSITION
  }
}

async function getUiSettings() {
  const [size, position] = await Promise.all([
    uiSizeStorage.getValue(),
    uiPositionStorage.getValue(),
  ])

  return {
    position: normalizePosition(position),
    size: normalizeSize(size),
  }
}

export {
  DEFAULT_POSITION,
  getUiSettings,
  normalizePosition,
  normalizeSize,
  uiPositionStorage,
  uiSizeStorage,
}
