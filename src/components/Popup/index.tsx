import { useEffect, useState } from 'react'
import type { FC } from 'react'
import Switch from 'rc-switch'
import { usePrevious } from './hook'
import './index.less'

interface PopupProps {
  onOpen: () => void
  onClose: () => void
  initialState: boolean
}
/**
 * @description:开关，用户可以自行控制是否开启全屏显示SC，因为用props值作为useState初始值，第一次进来会触发useEffect，所以使用了usePrevious获取前值做判断
 * @param {*} props
 * @return {*}
 */
const Popup: FC<PopupProps> = (props) => {
  const { onOpen, onClose, initialState } = props
  const [switchState, setSwitchState] = useState(initialState)
  const prevSwitchState = usePrevious(switchState)

  useEffect(() => {
    if (switchState && !prevSwitchState)
      onOpen()

    if (!switchState && prevSwitchState)
      onClose()
  }, [switchState, onOpen, onClose, prevSwitchState])

  return (
    <Switch checked={switchState} onChange={setSwitchState} />
  )
}

export default Popup
