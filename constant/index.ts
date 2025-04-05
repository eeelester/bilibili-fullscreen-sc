const WS_SC_EVENT = 'ws_sc_change'
const SIZE_EVENT = 'sc-resize'

enum sizeEnum {
    min = 'min',
    medium = 'medium',
    max = 'max'
}

const DEFAULT_SIZE = sizeEnum.medium

export { WS_SC_EVENT, SIZE_EVENT, DEFAULT_SIZE, sizeEnum }
