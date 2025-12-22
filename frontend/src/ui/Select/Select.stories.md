# Select Component

Кастомизируемый компонент выпадающего списка с поддержкой иконок, поиска и различных размеров.

## Основное использование

```tsx
import { Select } from '@/components/ui';

function MyComponent() {
  const [value, setValue] = useState('');

  return (
    <Select
      label="Choose an option"
      options={[
        { value: '1', label: 'Option 1' },
        { value: '2', label: 'Option 2' },
        { value: '3', label: 'Option 3' },
      ]}
      value={value}
      onChange={setValue}
      placeholder="Select..."
    />
  );
}
```

## С иконками

```tsx
<Select
  label="Select language"
  options={[
    { value: 'it', label: 'Italiano', icon: '🇮🇹' },
    { value: 'ru', label: 'Русский', icon: '🇷🇺' },
    { value: 'en', label: 'English', icon: '🇬🇧' },
  ]}
  value={locale}
  onChange={setLocale}
/>
```

## С поиском

```tsx
<Select
  label="Select city"
  searchable
  options={cities.map(city => ({
    value: city.code,
    label: city.name,
  }))}
  value={selectedCity}
  onChange={setSelectedCity}
/>
```

## Размеры

```tsx
<Select size="sm" options={options} /> // Маленький
<Select size="md" options={options} /> // Средний (по умолчанию)
<Select size="lg" options={options} /> // Большой
```

## С ошибкой

```tsx
<Select
  label="Required field"
  options={options}
  error="This field is required"
  value={value}
  onChange={setValue}
/>
```

## С подсказкой

```tsx
<Select
  label="Country"
  options={options}
  helperText="Select your country of residence"
  value={value}
  onChange={setValue}
/>
```

## Отключенные опции

```tsx
<Select
  options={[
    { value: '1', label: 'Available' },
    { value: '2', label: 'Unavailable', disabled: true },
    { value: '3', label: 'Available' },
  ]}
  value={value}
  onChange={setValue}
/>
```

## Полная ширина

```tsx
<Select
  fullWidth
  options={options}
  value={value}
  onChange={setValue}
/>
```

## Отключенный

```tsx
<Select
  disabled
  options={options}
  value={value}
  onChange={setValue}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `options` | `SelectOption[]` | - | **Required.** Массив опций для выбора |
| `value` | `string` | - | Контролируемое значение |
| `defaultValue` | `string` | - | Начальное значение (неконтролируемый режим) |
| `onChange` | `(value: string) => void` | - | Callback при изменении значения |
| `placeholder` | `string` | `'Select...'` | Текст плейсхолдера |
| `disabled` | `boolean` | `false` | Отключить компонент |
| `error` | `string` | - | Текст ошибки |
| `label` | `string` | - | Лейбл над селектом |
| `helperText` | `string` | - | Вспомогательный текст |
| `fullWidth` | `boolean` | `false` | Растянуть на всю ширину |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Размер компонента |
| `searchable` | `boolean` | `false` | Включить поиск по опциям |
| `className` | `string` | - | Дополнительный CSS класс |

## SelectOption

```typescript
interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}
```

## Особенности

- ✅ Полная поддержка клавиатуры (Enter, Space, Escape, Arrow Up/Down)
- ✅ Автоматическое закрытие при клике вне компонента
- ✅ Поддержка иконок в опциях
- ✅ Встроенный поиск по опциям
- ✅ Анимация открытия/закрытия
- ✅ Поддержка disabled опций
- ✅ Визуальная индикация выбранной опции
- ✅ Responsive дизайн
- ✅ Полная типизация TypeScript

## Доступность

- Использует правильные ARIA атрибуты (`role`, `aria-expanded`, `aria-selected`)
- Полная поддержка навигации с клавиатуры
- Правильный `tabIndex` для фокуса
- Семантическая структура HTML

