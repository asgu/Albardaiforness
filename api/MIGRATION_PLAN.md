# План миграции к единой базе данных

## Текущая ситуация
- 3 отдельных инстанса Symfony
- 3 отдельные базы данных
- Города: (например) Albaro, Fornezza, Santa Maria
- Дублирование персон между базами

## Целевая архитектура

### 1. Структура данных

#### Новая таблица: `City`
```sql
CREATE TABLE City (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) UNIQUE NOT NULL,  -- 'albaro', 'fornezza', 'santa_maria'
  name VARCHAR(255) NOT NULL,
  country VARCHAR(100),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Обновление таблицы `Person`
```sql
ALTER TABLE Person 
  ADD COLUMN city_id INT NULL,
  ADD COLUMN is_merged BOOLEAN DEFAULT FALSE,
  ADD COLUMN merged_from_ids JSON NULL,  -- Хранит ID персон из других городов
  ADD FOREIGN KEY (city_id) REFERENCES City(id);

-- Индекс для быстрого поиска по городу
CREATE INDEX idx_person_city ON Person(city_id);
CREATE INDEX idx_person_merged ON Person(is_merged);
```

#### Таблица для связи персон между городами
```sql
CREATE TABLE PersonCityLink (
  id INT PRIMARY KEY AUTO_INCREMENT,
  person_id INT NOT NULL,
  city_id INT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,  -- Основной город персоны
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (person_id) REFERENCES Person(id) ON DELETE CASCADE,
  FOREIGN KEY (city_id) REFERENCES City(id) ON DELETE CASCADE,
  UNIQUE KEY unique_person_city (person_id, city_id)
);
```

#### Таблица для отслеживания дубликатов
```sql
CREATE TABLE PersonDuplicate (
  id INT PRIMARY KEY AUTO_INCREMENT,
  person_id_1 INT NOT NULL,
  person_id_2 INT NOT NULL,
  similarity_score DECIMAL(5,2),  -- 0-100%
  status ENUM('pending', 'confirmed', 'rejected', 'merged') DEFAULT 'pending',
  merged_into_id INT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  reviewed_at DATETIME NULL,
  reviewed_by INT NULL,
  FOREIGN KEY (person_id_1) REFERENCES Person(id),
  FOREIGN KEY (person_id_2) REFERENCES Person(id),
  FOREIGN KEY (merged_into_id) REFERENCES Person(id),
  UNIQUE KEY unique_duplicate (person_id_1, person_id_2)
);
```

### 2. Миграция данных

#### Шаг 1: Создание городов
```sql
INSERT INTO City (code, name, country) VALUES
  ('albaro', 'Albaro', 'Italy'),
  ('fornezza', 'Fornezza', 'Italy'),
  ('santa_maria', 'Santa Maria', 'Italy');
```

#### Шаг 2: Импорт данных из трех баз
```bash
# Скрипт для каждой базы
# 1. Экспорт из старых баз
mysqldump -u root -p db_albaro Person > albaro_persons.sql
mysqldump -u root -p db_fornezza Person > fornezza_persons.sql
mysqldump -u root -p db_santa_maria Person > santa_maria_persons.sql

# 2. Импорт в новую базу с обновлением city_id
# (через скрипт миграции)
```

#### Шаг 3: Автоматическое определение дубликатов
Алгоритм поиска похожих персон:
- Совпадение: firstName + lastName + birthYear (100%)
- Частичное: firstName + lastName (80%)
- Fuzzy match: Levenshtein distance для имен (60-80%)

### 3. API изменения

#### Новые endpoints

**Города:**
- `GET /api/cities` - список городов
- `GET /api/cities/:code` - информация о городе
- `GET /api/cities/:code/persons` - персоны города

**Фильтрация по городу:**
- `GET /api/persons?city=albaro` - все персоны города
- `GET /api/persons/:id?include_cities=true` - персона со всеми городами

**Управление дубликатами:**
- `GET /api/duplicates` - список потенциальных дубликатов
- `POST /api/duplicates/:id/merge` - слияние персон
- `POST /api/duplicates/:id/reject` - отклонить дубликат
- `GET /api/persons/:id/duplicates` - найти дубликаты для персоны

**Слияние персон:**
- `POST /api/persons/merge` - объединить две персоны
  ```json
  {
    "sourceId": 123,
    "targetId": 456,
    "strategy": "keep_both_cities" | "merge_all"
  }
  ```

### 4. Стратегии слияния

#### Вариант A: Мягкое слияние (рекомендуется)
- Персоны остаются отдельными записями
- Связываются через `PersonCityLink`
- Можно видеть одну персону в контексте разных городов
- Сохраняется история

#### Вариант B: Жесткое слияние
- Одна запись остается (target)
- Другая помечается как `is_merged = true`
- Все связи переносятся на target
- `merged_from_ids` хранит историю

### 5. UI изменения

#### Фильтр по городу
```typescript
// В Next.js компоненте
const [selectedCity, setSelectedCity] = useState<string>('all');

// Запрос с фильтром
const persons = await fetch(`/api/persons?city=${selectedCity}`);
```

#### Индикатор множественных городов
```tsx
{person.cities.length > 1 && (
  <Badge>
    Присутствует в {person.cities.length} городах
  </Badge>
)}
```

#### Интерфейс слияния
```tsx
<DuplicateReview
  person1={person1}
  person2={person2}
  onMerge={handleMerge}
  onReject={handleReject}
/>
```

### 6. Преимущества решения

✅ Единая кодовая база
✅ Централизованное управление
✅ Возможность видеть связи между городами
✅ Гибкая система слияния
✅ Сохранение истории
✅ Масштабируемость (легко добавить новые города)

### 7. Риски и митигация

**Риск:** Потеря данных при слиянии
**Митигация:** Всегда сохранять историю, возможность отката

**Риск:** Производительность при больших объемах
**Митигация:** Индексы, кэширование, пагинация

**Риск:** Сложность определения дубликатов
**Митигация:** Ручная проверка, ML для улучшения точности

### 8. Порядок внедрения

1. ✅ Создать новую схему БД
2. ✅ Обновить TypeORM entities
3. ✅ Написать скрипт миграции данных
4. ✅ Реализовать API для городов
5. ✅ Реализовать поиск дубликатов
6. ✅ Реализовать механизм слияния
7. ✅ Обновить фронтенд
8. ✅ Тестирование
9. ✅ Постепенный переход (blue-green deployment)

### 9. Скрипты миграции

См. файлы:
- `scripts/migrate-database.ts` - основной скрипт миграции
- `scripts/find-duplicates.ts` - поиск дубликатов
- `scripts/merge-persons.ts` - слияние персон

