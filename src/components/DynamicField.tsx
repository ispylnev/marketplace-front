import { Input } from './ui/input';
import { Label } from './ui/label';
import { CategoryAttribute } from '../types/offer';

interface DynamicFieldProps {
  attribute: CategoryAttribute;
  value: string | number | boolean | null | undefined;
  onChange: (value: string | number | boolean | null) => void;
  error?: string;
}

/**
 * Компонент для динамического отображения поля атрибута категории.
 * Поддерживает типы: STRING, NUMBER, BOOLEAN, ENUM, DATE
 */
export function DynamicField({ attribute, value, onChange, error }: DynamicFieldProps) {
  const {
    attributeName,
    attributeType,
    enumValues,
    enumLabels,
    unit,
    isRequired,
    minValue,
    maxValue,
    maxLength,
  } = attribute;

  const label = isRequired ? `${attributeName} *` : attributeName;

  const baseInputClass = "w-full border border-[#2D2E30]/20 rounded-lg px-3 py-2 focus:outline-none focus:border-[#2B4A39]";

  switch (attributeType) {
    case 'STRING':
      return (
        <div>
          <Label className="flex items-center gap-2 mb-2">
            {label}
          </Label>
          <div className="relative">
            <Input
              type="text"
              value={(value as string) || ''}
              onChange={(e) => onChange(e.target.value || null)}
              maxLength={maxLength || undefined}
              placeholder={`Введите ${attributeName.toLowerCase()}`}
              className={unit ? 'pr-12' : ''}
            />
            {unit && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2D2E30]/50 text-sm">
                {unit}
              </span>
            )}
          </div>
          {maxLength && (
            <p className="text-xs text-[#2D2E30]/50 mt-1">
              Максимум {maxLength} символов
            </p>
          )}
          {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
        </div>
      );

    case 'NUMBER':
      return (
        <div>
          <Label className="flex items-center gap-2 mb-2">
            {label}
          </Label>
          <div className="relative">
            <Input
              type="number"
              value={value !== null && value !== undefined ? String(value) : ''}
              onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
              min={minValue !== null ? minValue : undefined}
              max={maxValue !== null ? maxValue : undefined}
              step="any"
              placeholder={`Введите ${attributeName.toLowerCase()}`}
              className={unit ? 'pr-12' : ''}
            />
            {unit && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2D2E30]/50 text-sm">
                {unit}
              </span>
            )}
          </div>
          {(minValue !== null || maxValue !== null) && (
            <p className="text-xs text-[#2D2E30]/50 mt-1">
              {minValue !== null && maxValue !== null
                ? `От ${minValue} до ${maxValue}`
                : minValue !== null
                ? `Минимум ${minValue}`
                : `Максимум ${maxValue}`}
            </p>
          )}
          {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
        </div>
      );

    case 'BOOLEAN':
      return (
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => onChange(e.target.checked)}
              className="w-4 h-4 rounded border-[#2D2E30]/20 text-[#2B4A39] focus:ring-[#2B4A39]"
            />
            <span className="text-sm text-[#2D2E30]">
              {label}
            </span>
          </label>
          {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
        </div>
      );

    case 'ENUM':
      return (
        <div>
          <Label className="flex items-center gap-2 mb-2">
            {label}
          </Label>
          <select
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value || null)}
            className={baseInputClass}
          >
            <option value="">Выберите...</option>
            {enumValues?.map((val) => (
              <option key={val} value={val}>
                {enumLabels?.[val] || val}
              </option>
            ))}
          </select>
          {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
        </div>
      );

    case 'DATE':
      return (
        <div>
          <Label className="flex items-center gap-2 mb-2">
            {label}
          </Label>
          <Input
            type="date"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value || null)}
          />
          {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
        </div>
      );

    default:
      // Fallback для неизвестных типов - отображаем как строку
      return (
        <div>
          <Label className="flex items-center gap-2 mb-2">
            {label}
          </Label>
          <Input
            type="text"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value || null)}
            placeholder={`Введите ${attributeName.toLowerCase()}`}
          />
          {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
        </div>
      );
  }
}

/**
 * Группа динамических полей с заголовком группы.
 */
interface DynamicFieldGroupProps {
  title: string;
  children: React.ReactNode;
}

export function DynamicFieldGroup({ title, children }: DynamicFieldGroupProps) {
  return (
    <div className="border-t border-[#2D2E30]/10 pt-4 mt-4 first:border-0 first:pt-0 first:mt-0">
      <h4 className="font-medium text-[#2D2E30] mb-3">{title}</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {children}
      </div>
    </div>
  );
}

export default DynamicField;
