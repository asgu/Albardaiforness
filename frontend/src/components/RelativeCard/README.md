# RelativeCard

Компактная карточка для отображения информации о персоне. Используется в списках родственников, результатах поиска и днях рождений.

## Использование

```typescript
import { RelativeCard } from '@/components';

<RelativeCard 
  person={person}
  isAuthenticated={true}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `person` | `PersonSummary & { maidenName?: string }` | required | Данные персоны |
| `marriageYear` | `number \| null` | `undefined` | Год брака (опционально) |
| `marriageDate` | `string \| null` | `undefined` | Дата брака (опционально) |
| `showMarriageInfo` | `boolean` | `false` | Показывать информацию о браке |
| `isAuthenticated` | `boolean` | `false` | Показывать ID только для авторизованных |

## Примеры

### Базовое использование
```typescript
<RelativeCard person={person} />
```

### С информацией о браке
```typescript
<RelativeCard 
  person={spouse}
  marriageYear={1985}
  showMarriageInfo={true}
/>
```

### Для авторизованных пользователей
```typescript
<RelativeCard 
  person={person}
  isAuthenticated={isAuthenticated}
/>
```

## Особенности

- ✅ Автоматическая капитализация имен
- ✅ Отображение аватара с иконкой пола
- ✅ Годы жизни в формате "1950-2020"
- ✅ Условное отображение ID для авторизованных
- ✅ Ссылка на страницу персоны
- ✅ Hover-эффекты

