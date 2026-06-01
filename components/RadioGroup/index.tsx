import { useCallback, useLayoutEffect, useState } from 'react'
import { DEFAULT_SIZE, sizeEnum } from '@/constant'
import './index.less'

interface RadioGroupProps {
  onChange: (size: sizeEnum) => void
}

export default function RadioGroup(props: RadioGroupProps) {
  const { onChange } = props
  const [size, setSize] = useState<sizeEnum>(DEFAULT_SIZE)

  const options = [
    { label: '大', value: sizeEnum.max },
    { label: '中', value: sizeEnum.medium },
    { label: '小', value: sizeEnum.min },
  ]

  const handleChange = useCallback((value: sizeEnum) => {
    setSize(value)
    onChange(value)
  }, [onChange])

  useLayoutEffect(() => {
    void (async () => {
      const savedSize: sizeEnum | null | undefined = await storage.getItem('local:UISize')
      setSize(savedSize && Object.values(sizeEnum).includes(savedSize) ? savedSize : DEFAULT_SIZE)
    })()
  }, [])

  return (
    <div className="radio-group">
      {options.map(({ value, label }) => (
        <label
          key={value}
          htmlFor={value}
          className={`option ${size === value ? 'checked' : ''}`}
          onClick={() => handleChange(value)}
        >
          {label}
          <input
            type="radio"
            value={value}
            name="status"
            checked={size === value}
            onChange={() => { }}
            className="radio"
          />
        </label>
      ))}
    </div>
  )
}
