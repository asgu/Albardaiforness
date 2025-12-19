# Types

Централизованные типы данных для проекта Albero.

## Использование

```tsx
import { Person, Gender, Server, Media } from '@/types';
import { getPersonUrlId, formatName, getAge } from '@/utils';

function MyComponent() {
  const person: Person = {
    id: '1',
    firstName: 'Antonio',
    lastName: 'Conte',
    gender: 'male',
    birthYear: 1765,
    // ...
  };

  const urlId = getPersonUrlId(person);
  const formattedName = formatName(person.firstName);
  const age = getAge(person);

  return <div>{formattedName} ({age} anni)</div>;
}
```

## Основные типы

### Person
Полная информация о персоне в генеалогическом древе.

**Основные поля:**
- `id`, `originalId` - идентификаторы
- `firstName`, `lastName`, `nickName`, `maidenName` - имена
- `gender` - пол (male/female/unknown)
- `birthYear`, `birthMonth`, `birthDay`, `birthPlace` - рождение
- `deathYear`, `deathMonth`, `deathDay`, `deathPlace` - смерть
- `occupation`, `note`, `privateNote` - дополнительная информация

**Связи:**
- `mother`, `father` - родители
- `children` - дети
- `spouses` - супруги

### PersonSummary
Упрощенная версия Person для списков и карточек.

```tsx
interface PersonSummary {
  id: string;
  originalId?: string;
  firstName: string;
  lastName: string;
  nickName?: string;
  gender: Gender;
  birthYear?: number;
  deathYear?: number;
  avatarMediaId?: string;
}
```

### PersonSearchResult
Расширенная версия PersonSummary для результатов поиска.

### Server
Информация о сервере (городе).

```tsx
interface Server {
  id: number;
  code: string;
  name: string;
  fullName: string;
  color: string;
  domain?: string;
  isActive: boolean;
}
```

### Media
Медиа файлы (фото, документы, видео).

```tsx
interface Media {
  id: string;
  mediaType: 'photo' | 'document' | 'video' | 'audio' | 'other';
  filePath: string;
  thumbnailPath?: string;
  title?: string;
  description?: string;
}
```

### Marriage
Информация о браке.

```tsx
interface Marriage {
  person: Person;
  marriageYear?: number;
  marriageDate?: string;
  marriagePlace?: string;
  isCurrent: boolean;
}
```

## API типы

### ApiError
```tsx
interface ApiError {
  error: string;
  message?: string;
  statusCode?: number;
}
```

### PaginatedResponse
```tsx
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

### SearchParams
```tsx
interface SearchParams {
  q: string;
  server?: string;
  page?: number;
  limit?: number;
}
```

## Утилиты

Все утилиты для работы с типами находятся в `@/utils`:

```tsx
import {
  getPersonUrlId,
  getGenderIcon,
  getGenderLabel,
  formatDate,
  formatName,
  getFullName,
  getAge,
  isAlive,
  getLifeYears,
  getAvatarUrl,
  getAllChildren,
  getAllSpouses,
  hasParents,
  hasChildren,
  hasSpouses,
} from '@/utils';
```

## Лучшие практики

1. **Используйте централизованные типы** вместо локальных interface
2. **Импортируйте из @/types** для консистентности
3. **Используйте утилиты** для общих операций
4. **Не дублируйте типы** - расширяйте существующие
5. **Документируйте** новые типы в README

## Примеры

### Компонент с Person

```tsx
import { Person } from '@/types';
import { getFullName, getAge, getGenderIcon } from '@/utils';

interface PersonCardProps {
  person: Person;
}

export function PersonCard({ person }: PersonCardProps) {
  return (
    <div>
      <h3>{getFullName(person)}</h3>
      <p>{getGenderIcon(person.gender)} {getAge(person)} anni</p>
    </div>
  );
}
```

### API запрос с типами

```tsx
import { Person, ApiError } from '@/types';
import axios from 'axios';

async function fetchPerson(id: string): Promise<Person> {
  try {
    const response = await axios.get<Person>(`/api/person/${id}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const apiError = error.response?.data as ApiError;
      throw new Error(apiError.message || apiError.error);
    }
    throw error;
  }
}
```

### Поиск с типами

```tsx
import { PersonSearchResult, SearchParams } from '@/types';

async function searchPersons(params: SearchParams): Promise<PersonSearchResult[]> {
  const response = await fetch(`/api/search?${new URLSearchParams(params)}`);
  return response.json();
}
```

