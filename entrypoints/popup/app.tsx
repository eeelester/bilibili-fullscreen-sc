import RadioGroup from '@/components/RadioGroup'
import SCList from '@/components/ScList'
import { processData, processSize } from '@/utils'
import { useEffect, useState } from 'react'
import { PositionEnum } from '@/constant'

import { testData } from '@/dev/testData'
import './app.less'
import type { sizeEnum } from '@/constant'

function App() {
  const [position, setPosition] = useState<PositionEnum>(PositionEnum.BOTTOM_LEFT)

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

    // 获取保存的位置设置
    void (async () => {
      try {
        const savedPosition = await storage.getItem('local:UIPosition')
        if (savedPosition && Object.values(PositionEnum).includes(savedPosition as PositionEnum)) {
          setPosition(savedPosition as PositionEnum)
        }
      }
      catch (error) {
        console.error('获取位置设置失败:', error)
      }
    })()
  }, [])

  const handleSizeChange = (v: sizeEnum) => {
    processSize(v)
    void onResize(v)
  }

  const handlePositionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPosition = e.target.value as PositionEnum
    setPosition(newPosition)
    void onChangePosition(newPosition)
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
      <RadioGroup onChange={handleSizeChange} />
      <div className="divider"></div>
      <legend className="title">示例：</legend>
      <SCList scDocument={document} />
    </div>
  )
}

async function onResize(size: sizeEnum) {
  const [tab] = await browser.tabs.query({
    active: true,
    currentWindow: true,
  })
  await browser.tabs.sendMessage(tab.id as number, {
    size,
  })

  // 存着，不然下次点击popup就没有了
  await storage.setItem<sizeEnum>('local:UISize', size)
}

async function onChangePosition(position: PositionEnum) {
  const [tab] = await browser.tabs.query({
    active: true,
    currentWindow: true,
  })
  await browser.tabs.sendMessage(tab.id as number, {
    position,
  })

  // 保存位置设置
  await storage.setItem<PositionEnum>('local:UIPosition', position)
}

export default App
