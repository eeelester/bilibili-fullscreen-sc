import type { FC } from 'react'
import Switch from 'rc-switch'
import './index.less'

interface PopupProps {
  switchChange: React.Dispatch<React.SetStateAction<boolean>>
  switchState: boolean
}
const Popup: FC<PopupProps> = (props) => {
  const { switchState, switchChange } = props

  return (
    <Switch checked={switchState} onChange={switchChange} />
  )
}

export default Popup
