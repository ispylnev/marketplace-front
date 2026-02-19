import * as React from "react"

// Context для передачи value и onValueChange
interface RadioGroupContextValue {
  value: string
  onValueChange: (value: string) => void
}

const RadioGroupContext = React.createContext<RadioGroupContextValue | undefined>(undefined)

export interface RadioGroupProps {
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
}

export const RadioGroup = ({ value, onValueChange, children }: RadioGroupProps) => {
  return (
    <RadioGroupContext.Provider value={{ value, onValueChange }}>
      <div role="radiogroup" className="space-y-2">
        {children}
      </div>
    </RadioGroupContext.Provider>
  )
}

export interface RadioGroupItemProps {
  value: string
  id: string
}

export const RadioGroupItem = ({ value, id }: RadioGroupItemProps) => {
  const context = React.useContext(RadioGroupContext)

  if (!context) {
    console.error('RadioGroupItem must be used within RadioGroup')
    return null
  }

  const { value: selectedValue, onValueChange } = context
  const checked = value === selectedValue

  const handleClick = () => {
    console.log('Item clicked! value:', value, 'checked:', checked);
    // Если кликнули на уже выбранный - снимаем выбор
    if (checked) {
      console.log('Снимаем выбор');
      onValueChange('');
    } else {
      console.log('Ставим выбор:', value);
      onValueChange(value);
    }
  }

  return (
    <div
      id={id}
      onClick={handleClick}
      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all ${
        checked
          ? 'border-[#2B4A39] bg-[#2B4A39]'
          : 'border-gray-300 bg-white hover:border-[#2B4A39]'
      }`}
      role="radio"
      aria-checked={checked}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {checked && (
        <div className="w-2 h-2 rounded-full bg-white" />
      )}
    </div>
  )
}
