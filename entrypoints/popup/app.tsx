import { useEffect, useState } from 'react'
import RadioGroup from '@/components/RadioGroup'
import SCList from '@/components/ScList'
import { PositionEnum, sizeEnum } from '@/constant'
import { createSuperChatFixture } from '@/fixtures/superChat'
import { processData } from '@/utils'
import { DEFAULT_POSITION, getUiSettings, uiPositionStorage, uiSizeStorage } from '@/utils/settings'
import './app.less'

const previewSuperChat = createSuperChatFixture({
  message: '全屏观看时，醒目留言会显示在所选位置。',
  time: 1200,
  user_info: {
    face: 'https://i0.hdslb.com/bfs/face/example.jpg',
    face_frame: '',
    name_color: '#666666',
    uname: '示例用户',
  },
})

function App() {
  const [size, setSize] = useState<sizeEnum>(sizeEnum.medium)
  const [position, setPosition] = useState<PositionEnum>(DEFAULT_POSITION)
  const [isLoading, setIsLoading] = useState(true)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    let active = true

    void getUiSettings().then((settings) => {
      if (!active)
        return

      setSize(settings.size)
      setPosition(settings.position)
    }).catch(() => {
      if (active)
        setSaveError('读取设置失败，已使用默认值。')
    }).finally(() => {
      if (active)
        setIsLoading(false)
    })

    processData(previewSuperChat)
    return () => {
      active = false
    }
  }, [])

  const handleSizeChange = async (nextSize: sizeEnum) => {
    setSize(nextSize)
    setSaveError('')
    try {
      await uiSizeStorage.setValue(nextSize)
    }
    catch {
      setSaveError('保存 UI 大小失败，请重试。')
    }
  }

  const handlePositionChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextPosition = event.target.value as PositionEnum
    setPosition(nextPosition)
    setSaveError('')
    try {
      await uiPositionStorage.setValue(nextPosition)
    }
    catch {
      setSaveError('保存初始位置失败，请重试。')
    }
  }

  return (
    <main className={`popup-wrap popup-size-${size}`} aria-busy={isLoading}>
      <fieldset className="settings-group" disabled={isLoading}>
        <legend className="title">SC 初始位置</legend>
        <label className="sr-only" htmlFor="sc-position">选择 SC 初始位置</label>
        <select
          id="sc-position"
          className="position-select"
          value={position}
          onChange={event => void handlePositionChange(event)}
        >
          <option value={PositionEnum.TOP_LEFT}>左上</option>
          <option value={PositionEnum.TOP_RIGHT}>右上</option>
          <option value={PositionEnum.BOTTOM_LEFT}>左下</option>
          <option value={PositionEnum.BOTTOM_RIGHT}>右下</option>
        </select>
      </fieldset>

      <div className="divider" />

      <fieldset className="settings-group" disabled={isLoading}>
        <legend className="title">UI 大小</legend>
        <RadioGroup value={size} disabled={isLoading} onChange={nextSize => void handleSizeChange(nextSize)} />
      </fieldset>

      {saveError ? <p className="settings-error" role="alert">{saveError}</p> : null}

      <div className="divider" />
      <section aria-labelledby="preview-title">
        <h2 id="preview-title" className="title">预览</h2>
        <SCList scDocument={document} />
      </section>
    </main>
  )
}

export default App
