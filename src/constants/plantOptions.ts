/**
 * Опции для параметров ухода за растениями.
 * Значения соответствуют backend enum-ам: LightRequirement, WateringFrequency и т.д.
 */

export const lightingOptions = [
  { value: 'LOW_LIGHT', label: 'Тень' },
  { value: 'SHADE', label: 'Полутень' },
  { value: 'PARTIAL_SHADE', label: 'Рассеянный свет' },
  { value: 'BRIGHT_INDIRECT', label: 'Яркий рассеянный' },
  { value: 'FULL_SUN', label: 'Прямой солнечный' }
];

export const wateringOptions = [
  { value: 'VERY_LOW', label: 'Очень редкий' },
  { value: 'LOW', label: 'Редкий (раз в 2 недели)' },
  { value: 'MODERATE', label: 'Умеренный (раз в неделю)' },
  { value: 'HIGH', label: 'Частый (2-3 раза в неделю)' },
  { value: 'VERY_HIGH', label: 'Очень частый' }
];

export const humidityOptions = [
  { value: 'LOW', label: 'Низкая' },
  { value: 'MEDIUM', label: 'Средняя' },
  { value: 'HIGH', label: 'Высокая' },
  { value: 'VERY_HIGH', label: 'Очень высокая' }
];

export const difficultyOptions = [
  { value: 'BEGINNER', label: 'Для новичков' },
  { value: 'EASY', label: 'Легко' },
  { value: 'MODERATE', label: 'Средне' },
  { value: 'ADVANCED', label: 'Требует опыта' },
  { value: 'EXPERT', label: 'Для экспертов' }
];

export const toxicityOptions = [
  { value: 'NON_TOXIC', label: 'Безопасно' },
  { value: 'MILDLY_TOXIC', label: 'Слабо токсично' },
  { value: 'TOXIC_TO_PETS', label: 'Токсично для питомцев' },
  { value: 'TOXIC_TO_HUMANS', label: 'Токсично для людей' },
  { value: 'HIGHLY_TOXIC', label: 'Высоко токсично' }
];
