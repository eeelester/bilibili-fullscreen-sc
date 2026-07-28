import { sizeEnum } from '@/constant'
import './index.less'

interface RadioGroupProps {
  disabled?: boolean
  onChange: (size: sizeEnum) => void
  value: sizeEnum
}

const options: Array<{ label: string, value: sizeEnum }> = [
  { label: '大', value: sizeEnum.max },
  { label: '中', value: sizeEnum.medium },
  { label: '小', value: sizeEnum.min },
]

export default function RadioGroup({ disabled = false, onChange, value: selectedSize }: RadioGroupProps) {
  return (
    <div className="radio-group">
      {options.map(({ value, label }) => {
        const id = `sc-size-${value}`
        return (
          <label
            key={value}
            htmlFor={id}
            className={`option ${selectedSize === value ? 'checked' : ''}`}
          >
            {label}
            <input
              id={id}
              type="radio"
              value={value}
              name="sc-size"
              checked={selectedSize === value}
              disabled={disabled}
              onChange={() => onChange(value)}
              className="radio"
            />
          </label>
        )
      })}
    </div>
  )
}
