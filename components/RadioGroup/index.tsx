import { sizeEnum } from '@/constant'
import './index.less'

interface RadioGroupProps {
  value: sizeEnum
  onChange: (size: sizeEnum) => void
}

export default function RadioGroup(props: RadioGroupProps) {
  const { onChange, value: size } = props

  const options = [
    { label: '大', value: sizeEnum.max },
    { label: '中', value: sizeEnum.medium },
    { label: '小', value: sizeEnum.min },
  ]

  return (
    <div className="radio-group">
      {options.map(({ value, label }) => (
        <label
          key={value}
          htmlFor={value}
          className={`option ${size === value ? 'checked' : ''}`}
        >
          {label}
          <input
            type="radio"
            id={value}
            value={value}
            name="status"
            checked={size === value}
            onChange={() => onChange(value)}
            className="radio"
          />
        </label>
      ))}
    </div>
  )
}
