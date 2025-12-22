# SearchBox

Компонент формы поиска с простым и расширенным режимами.

## Использование

```typescript
import { SearchBox } from '@/components';

<SearchBox 
  initialValues={{ firstName: 'John' }}
  isAuthenticated={true}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialValues` | `object` | `{}` | Начальные значения полей формы |
| `isAuthenticated` | `boolean` | `false` | Показывать поле ID только для авторизованных |

## Initial Values

```typescript
{
  q?: string;           // Простой поиск
  id?: string;          // ID персоны (только для авторизованных)
  firstName?: string;   // Имя
  lastName?: string;    // Фамилия
  nickName?: string;    // Прозвище
  birthYear?: string;   // Год рождения (поддерживает >1950, <1950, 1930-1950)
  deathYear?: string;   // Год смерти (поддерживает fuzzy search)
  birthPlace?: string;  // Место рождения
  occupation?: string;  // Профессия
  note?: string;        // Заметки
  gender?: 'male' | 'female'; // Пол
}
```

## Режимы поиска

### Простой поиск
- Одно поле для быстрого поиска по имени/фамилии
- Кнопка переключения на расширенный поиск

### Расширенный поиск
- Все поля для детального поиска
- Fuzzy search для годов (`>1950`, `<1950`, `1930-1950`)
- Селектор пола
- Кнопка очистки формы

## Примеры

### Базовое использование
```typescript
<SearchBox />
```

### С начальными значениями
```typescript
<SearchBox 
  initialValues={{
    firstName: 'John',
    lastName: 'Doe',
    birthYear: '>1950'
  }}
/>
```

### Для авторизованных пользователей
```typescript
<SearchBox 
  isAuthenticated={isAuthenticated}
  initialValues={{ id: '12345' }}
/>
```

## Особенности

- ✅ Анимация разворачивания расширенной формы
- ✅ Fuzzy search для годов с подсказками
- ✅ Автоматическая навигация к результатам
- ✅ Сохранение параметров в URL
- ✅ Полная интернационализация
- ✅ Валидация полей
- ✅ Адаптивный дизайн

