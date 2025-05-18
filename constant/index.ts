const WS_SC_EVENT = 'ws_sc_change'
const SIZE_EVENT = 'sc-resize'

enum sizeEnum {
  min = 'min',
  medium = 'medium',
  max = 'max',
}

const DEFAULT_SIZE = sizeEnum.medium

// 定义位置事件名称
const POSITION_EVENT = 'position-change'

// 定义位置枚举
enum PositionEnum {
  TOP_LEFT = 'top-left',
  TOP_RIGHT = 'top-right',
  BOTTOM_LEFT = 'bottom-left',
  BOTTOM_RIGHT = 'bottom-right',
}

export { WS_SC_EVENT, SIZE_EVENT, DEFAULT_SIZE, sizeEnum, POSITION_EVENT, PositionEnum }
