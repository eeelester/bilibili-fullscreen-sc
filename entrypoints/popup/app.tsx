import { useEffect } from 'react'
import RadioGroup from '@/components/RadioGroup'
import SCList from '@/components/ScList'
import { processData, processPosition, processSize } from '@/utils'
import { PositionEnum } from '@/constant'
import { useUiSettings } from '@/components/useUiSettings'
import { saveUiPosition, saveUiSize } from '@/utils/settings'

import { testData } from '@/dev/testData'
import './app.less'
import type { sizeEnum } from '@/constant'

function App() {
  const settings = useUiSettings()
  const { position } = settings

  useEffect(() => {
    processData({
      ...testData,
      data: {
        ...testData.data,
        time: 1200,
        message: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
        user_info: {
          ...testData.data.user_info,
          uname: 'XXXXXXXXXXXXXXXXXXXXXX',
        },
      },
    })
  }, [])

  const handleSizeChange = (v: sizeEnum) => {
    processSize(v)
    void onResize(v).catch(error => console.error('保存UI大小失败:', error))
  }

  const handlePositionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPosition = e.target.value as PositionEnum
    processPosition(newPosition)
    void onChangePosition(newPosition).catch(error => console.error('保存位置失败:', error))
  }

  return (
    <div className="popup-wrap">
      <legend className="title">SC初始位置</legend>
      <select
        className="position-select"
        value={position}
        onChange={handlePositionChange}
      >
        <option value={PositionEnum.TOP_LEFT}>左上</option>
        <option value={PositionEnum.TOP_RIGHT}>右上</option>
        <option value={PositionEnum.BOTTOM_LEFT}>左下</option>
        <option value={PositionEnum.BOTTOM_RIGHT}>右下</option>
      </select>
      <div className="divider"></div>
      <legend className="title">UI大小</legend>
      <RadioGroup value={settings.size} onChange={handleSizeChange} />
      <div className="divider"></div>
      <legend className="title">示例：</legend>
      <SCList scDocument={document} uiSettings={settings} preview />
    </div>
  )
}

async function onResize(size: sizeEnum) {
  // 存着，不然下次点击popup就没有了
  await saveUiSize(size)
  await sendMessageToActiveTab({ size })
}

async function onChangePosition(position: PositionEnum) {
  // 保存位置设置
  await saveUiPosition(position)
  await sendMessageToActiveTab({ position })
}

async function sendMessageToActiveTab(message: { size?: sizeEnum, position?: PositionEnum }) {
  try {
    const [tab] = await browser.tabs.query({
      active: true,
      currentWindow: true,
    })
    if (tab?.id === undefined)
      return
    await browser.tabs.sendMessage(tab.id, message)
  }
  catch (error) {
    console.warn('当前页面未加载B站助手content script，设置已保存。', error)
  }
}

export default App
