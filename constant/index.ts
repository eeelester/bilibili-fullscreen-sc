const WS_SC_EVENT = 'ws_sc_change'

enum sizeEnum {
  min = 'min',
  medium = 'medium',
  max = 'max',
}

const DEFAULT_SIZE = sizeEnum.medium

// 定义位置枚举
enum PositionEnum {
  TOP_LEFT = 'top-left',
  TOP_RIGHT = 'top-right',
  BOTTOM_LEFT = 'bottom-left',
  BOTTOM_RIGHT = 'bottom-right',
}

export { DEFAULT_SIZE, PositionEnum, sizeEnum, WS_SC_EVENT }
