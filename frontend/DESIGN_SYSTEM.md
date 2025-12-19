# Albero Design System

Современная дизайн-система для проекта Albero с переиспользуемыми UI компонентами.

## Компоненты

### Button

Универсальная кнопка с различными вариантами и размерами.

```tsx
import { Button } from '@/components/ui';

// Базовое использование
<Button>Click me</Button>

// Варианты
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="danger">Danger</Button>

// Размеры
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

// С иконкой
<Button icon={<span>🌳</span>}>Albero</Button>
<Button icon={<span>✏️</span>} iconPosition="right">Edit</Button>

// Состояния
<Button loading>Loading...</Button>
<Button disabled>Disabled</Button>
<Button fullWidth>Full Width</Button>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
- `size`: 'sm' | 'md' | 'lg'
- `fullWidth`: boolean
- `loading`: boolean
- `icon`: ReactNode
- `iconPosition`: 'left' | 'right'

---

### Input

Поле ввода с поддержкой лейблов, ошибок и иконок.

```tsx
import { Input } from '@/components/ui';

// Базовое использование
<Input placeholder="Enter text..." />

// С лейблом
<Input label="Name" placeholder="Your name" />

// С обязательным полем
<Input label="Email" required placeholder="your@email.com" />

// С ошибкой
<Input 
  label="Password" 
  error="Password is too short" 
  type="password" 
/>

// С подсказкой
<Input 
  label="Username" 
  helperText="Must be 3-20 characters" 
/>

// С иконкой
<Input 
  icon={<span>🔍</span>} 
  placeholder="Search..." 
/>

// Полная ширина
<Input fullWidth placeholder="Full width input" />
```

**Props:**
- `label`: string
- `error`: string
- `helperText`: string
- `icon`: ReactNode
- `iconPosition`: 'left' | 'right'
- `fullWidth`: boolean
- `required`: boolean

---

### Card

Контейнер для группировки контента.

```tsx
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui';

// Базовое использование
<Card>
  <p>Card content</p>
</Card>

// С секциями
<Card>
  <CardHeader>
    <h3>Card Title</h3>
  </CardHeader>
  <CardBody>
    <p>Card content goes here</p>
  </CardBody>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>

// Варианты
<Card variant="default">Default</Card>
<Card variant="outlined">Outlined</Card>
<Card variant="elevated">Elevated</Card>

// Отступы
<Card padding="none">No padding</Card>
<Card padding="sm">Small padding</Card>
<Card padding="md">Medium padding</Card>
<Card padding="lg">Large padding</Card>

// Интерактивная карточка
<Card hoverable onClick={() => console.log('clicked')}>
  Click me!
</Card>
```

**Props:**
- `variant`: 'default' | 'outlined' | 'elevated'
- `padding`: 'none' | 'sm' | 'md' | 'lg'
- `hoverable`: boolean

---

### Avatar

Аватар пользователя с поддержкой изображений и плейсхолдеров.

```tsx
import { Avatar } from '@/components/ui';

// С изображением
<Avatar src="/path/to/image.jpg" alt="User name" />

// Плейсхолдер по полу
<Avatar gender="male" />
<Avatar gender="female" />
<Avatar gender="unknown" />

// Размеры
<Avatar size="xs" gender="male" />
<Avatar size="sm" gender="female" />
<Avatar size="md" gender="male" />
<Avatar size="lg" gender="female" />
<Avatar size="xl" gender="male" />

// Кастомный fallback
<Avatar fallback={<span>JD</span>} />
```

**Props:**
- `src`: string
- `alt`: string
- `size`: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
- `gender`: 'male' | 'female' | 'unknown'
- `fallback`: ReactNode

---

## Цветовая палитра

```scss
$primary-color: #0ea5e9;    // Основной цвет
$secondary-color: #10b981;  // Вторичный цвет
$accent-color: #f59e0b;     // Акцентный цвет
$error-color: #ef4444;      // Ошибка
$success-color: #10b981;    // Успех
$text-color: #1f2937;       // Основной текст
$text-light: #6b7280;       // Светлый текст
$bg-color: #ffffff;         // Фон
$bg-light: #f9fafb;         // Светлый фон
$border-color: #e5e7eb;     // Границы
```

## Типографика

```scss
$font-size-xs: 0.75rem;     // 12px
$font-size-sm: 0.875rem;    // 14px
$font-size-base: 1rem;      // 16px
$font-size-lg: 1.125rem;    // 18px
$font-size-xl: 1.25rem;     // 20px
$font-size-2xl: 1.5rem;     // 24px
$font-size-3xl: 1.875rem;   // 30px
$font-size-4xl: 2.25rem;    // 36px
```

## Отступы

```scss
$spacing-xs: 0.25rem;   // 4px
$spacing-sm: 0.5rem;    // 8px
$spacing-md: 1rem;      // 16px
$spacing-lg: 1.5rem;    // 24px
$spacing-xl: 2rem;      // 32px
$spacing-2xl: 3rem;     // 48px
```

## Скругления

```scss
$radius-sm: 0.25rem;    // 4px
$radius-md: 0.375rem;   // 6px
$radius-lg: 0.5rem;     // 8px
$radius-xl: 0.75rem;    // 12px
$radius-full: 9999px;   // Полный круг
```

## Тени

```scss
$shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
$shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
$shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
$shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
```

## Миксины

### flex-center
Центрирование по обеим осям:
```scss
@use '@/styles/mixins' as *;

.element {
  @include flex-center;
}
```

### flex-column
Flex колонка:
```scss
.element {
  @include flex-column;
}
```

### spinner
Анимированный спиннер:
```scss
.element {
  @include spinner(40px);
}
```

## Примеры использования

### Форма поиска

```tsx
import { Input, Button, Card } from '@/components/ui';

function SearchForm() {
  return (
    <Card>
      <CardBody>
        <Input
          icon={<span>🔍</span>}
          placeholder="Cerca persona..."
          fullWidth
        />
        <Button variant="primary" fullWidth>
          Cerca
        </Button>
      </CardBody>
    </Card>
  );
}
```

### Карточка персоны

```tsx
import { Card, Avatar, Button } from '@/components/ui';

function PersonCard({ person }) {
  return (
    <Card hoverable>
      <CardBody>
        <Avatar 
          src={person.avatar} 
          gender={person.gender}
          size="lg"
        />
        <h3>{person.name}</h3>
        <p>{person.birthYear} - {person.deathYear}</p>
      </CardBody>
      <CardFooter>
        <Button variant="outline" size="sm">
          Visualizza
        </Button>
      </CardFooter>
    </Card>
  );
}
```

## Лучшие практики

1. **Используйте семантические варианты**: `primary` для основных действий, `danger` для удаления
2. **Соблюдайте иерархию**: используйте разные размеры для визуальной иерархии
3. **Доступность**: всегда добавляйте `alt` для изображений и `label` для инпутов
4. **Консистентность**: используйте одинаковые размеры компонентов в одном контексте
5. **Responsive**: используйте `fullWidth` для мобильных устройств

## Roadmap

- [ ] Select / Dropdown
- [ ] Checkbox / Radio
- [ ] Modal / Dialog
- [ ] Toast / Notification
- [ ] Tabs
- [ ] Tooltip
- [ ] Badge
- [ ] Spinner (standalone)
- [ ] Skeleton
- [ ] Pagination

