# Albero - Финальная схема базы данных

## Проблемы текущей архитектуры

1. **Circular cascade dependencies** - children/parents отношения с cascade
2. **Избыточность данных** - дублирование информации о городах
3. **Неоптимальные индексы** - медленный поиск
4. **Сложные many-to-many** - Brotherhood, Children через join таблицы без доп. атрибутов
5. **Отсутствие версионирования** - нет истории изменений
6. **Нет soft delete** - удаление данных безвозвратно

## Новая архитектура

### Принципы проектирования

1. **Нормализация** - 3NF для основных данных
2. **Простота** - минимум таблиц, максимум эффективности
3. **Индексы** - для всех поисковых полей
4. **Soft delete** - флаг deletedAt вместо физического удаления
5. **Audit trail** - история всех изменений

## Основные таблицы

### 1. servers (Серверы/Города)

**Назначение:** Справочник серверов (ранее отдельные базы данных для каждого города)

**Поля:**
- `id` - INT, PRIMARY KEY, AUTO_INCREMENT
- `code` - VARCHAR(50), UNIQUE, NOT NULL (albaro, fornezza, santa-maria)
- `name` - VARCHAR(255), NOT NULL
- `full_name` - VARCHAR(255)
- `description` - TEXT
- `color` - VARCHAR(7) (hex цвет для UI)
- `domain` - VARCHAR(255) (домен сервера)
- `is_active` - BOOLEAN, DEFAULT TRUE
- `created_at` - TIMESTAMP
- `updated_at` - TIMESTAMP

**Индексы:**
- PRIMARY KEY (id)
- UNIQUE (code)
- INDEX (is_active)

---

### 2. persons (Персоны)

**Назначение:** Основная таблица с информацией о людях

**Поля:**

**Основная информация:**
- `id` - BIGINT, PRIMARY KEY, AUTO_INCREMENT
- `first_name` - VARCHAR(255), NOT NULL
- `last_name` - VARCHAR(255), NOT NULL
- `maiden_name` - VARCHAR(255) (девичья фамилия)
- `nick_name` - VARCHAR(255) (прозвище)

**Даты (гибкая структура для неполных данных):**
> Часто в генеалогии известен только год или год+месяц, но не полная дата.
> Поэтому храним и полную дату (DATE) и отдельные компоненты (year/month/day).
- `birth_date` - DATE (полная дата, если известна)
- `birth_year` - SMALLINT (обязательно, если что-то известно)
- `birth_month` - TINYINT (1-12, если известен)
- `birth_day` - TINYINT (1-31, если известен)
- `death_date` - DATE (полная дата, если известна)
- `death_year` - SMALLINT (если известен)
- `death_month` - TINYINT (1-12, если известен)
- `death_day` - TINYINT (1-31, если известен)

**Дополнительная информация:**
- `gender` - ENUM('male', 'female', 'unknown'), DEFAULT 'unknown'
- `occupation` - VARCHAR(255) (профессия)
- `note` - TEXT (публичная заметка, например "уехал в Южную Америку в 1952")
- `private_note` - TEXT (приватная заметка для администраторов)

**Места:**
- `birth_place` - VARCHAR(255)
- `death_place` - VARCHAR(255)
- `burial_place` - VARCHAR(255)

**Медиа:**
- `avatar_media_id` - BIGINT, FOREIGN KEY -> media(id) (ссылка на фото из галереи)
- `avatar_crop` - JSON (координаты обрезки: {x, y, width, height})

**Родители (упрощенная схема):**
- `mother_id` - BIGINT, FOREIGN KEY -> persons(id)
- `father_id` - BIGINT, FOREIGN KEY -> persons(id)

**Сервер:**
- `primary_server_id` - INT, FOREIGN KEY -> servers(id)

**Метаданные:**
- `is_public` - BOOLEAN, DEFAULT TRUE (видна ли персона публично)

**Дубликаты и слияние:**
> При миграции из 3 баз один человек может быть в каждой базе.
> Также возможны дубликаты внутри одной базы.
- `is_merged` - BOOLEAN, DEFAULT FALSE (помечен как дубликат)
- `merged_into_id` - BIGINT, FOREIGN KEY -> persons(id) (ссылка на основную запись)
- `source_db` - VARCHAR(50) (откуда импортирован: albaro, fornezza, santa-maria)
- `original_id` - BIGINT (ID в исходной базе для отслеживания)

**Audit:**
- `created_at` - TIMESTAMP
- `updated_at` - TIMESTAMP
- `deleted_at` - TIMESTAMP NULL
- `created_by` - INT
- `updated_by` - INT

**Индексы:**
- PRIMARY KEY (id)
- INDEX (last_name, first_name)
- INDEX (mother_id)
- INDEX (father_id)
- INDEX (avatar_media_id)
- INDEX (birth_year)
- INDEX (birth_date)
- INDEX (death_year)
- INDEX (primary_server_id)
- INDEX (gender)
- INDEX (deleted_at)
- INDEX (is_merged, merged_into_id)
- INDEX (source_db, original_id) - для отслеживания источника
- FULLTEXT (first_name, last_name, maiden_name, nick_name, note)

---

### 3. marriages (Браки)

**Назначение:** Информация о браках между людьми

**Поля:**
- `id` - BIGINT, PRIMARY KEY, AUTO_INCREMENT
- `person1_id` - BIGINT, NOT NULL, FOREIGN KEY -> persons(id)
- `person2_id` - BIGINT, NOT NULL, FOREIGN KEY -> persons(id)
- `marriage_date` - DATE
- `marriage_year` - SMALLINT
- `marriage_place` - VARCHAR(255)
- `divorce_date` - DATE
- `divorce_year` - SMALLINT
- `is_current` - BOOLEAN, DEFAULT TRUE
- `notes` - TEXT
- `created_at` - TIMESTAMP
- `updated_at` - TIMESTAMP
- `deleted_at` - TIMESTAMP NULL
- `created_by` - INT

**Ограничения:**
- CHECK (person1_id < person2_id) - для предотвращения дублей

**Индексы:**
- PRIMARY KEY (id)
- INDEX (person1_id)
- INDEX (person2_id)
- INDEX (is_current)
- INDEX (deleted_at)

---

### 4. media (Медиафайлы)

**Назначение:** Фото, видео, документы, аудио

**Поля:**
- `id` - BIGINT, PRIMARY KEY, AUTO_INCREMENT
- `person_id` - BIGINT, FOREIGN KEY -> persons(id)
- `media_type` - ENUM('photo', 'video', 'document', 'audio'), NOT NULL
- `file_path` - VARCHAR(500), NOT NULL
- `file_name` - VARCHAR(255), NOT NULL
- `file_size` - INT
- `mime_type` - VARCHAR(100)
- `thumbnail_path` - VARCHAR(500)
- `title` - VARCHAR(255)
- `description` - TEXT
- `date_taken` - DATE
- `location` - VARCHAR(255)
- `sort_order` - INT, DEFAULT 0
- `is_public` - BOOLEAN, DEFAULT TRUE
- `is_primary` - BOOLEAN, DEFAULT FALSE (основное фото персоны)
- `created_at` - TIMESTAMP
- `updated_at` - TIMESTAMP
- `deleted_at` - TIMESTAMP NULL
- `uploaded_by` - INT

**Индексы:**
- PRIMARY KEY (id)
- INDEX (person_id)
- INDEX (media_type)
- INDEX (deleted_at)
- INDEX (is_primary)

---

### 5. media_persons (Люди на фото/видео)

**Назначение:** Тегирование людей на фото и видео

**Поля:**
- `id` - BIGINT, PRIMARY KEY, AUTO_INCREMENT
- `media_id` - BIGINT, NOT NULL, FOREIGN KEY -> media(id)
- `person_id` - BIGINT, NOT NULL, FOREIGN KEY -> persons(id)
- `position_x` - DECIMAL(5,2) (процент от ширины)
- `position_y` - DECIMAL(5,2) (процент от высоты)
- `created_at` - TIMESTAMP

**Индексы:**
- PRIMARY KEY (id)
- UNIQUE (media_id, person_id)
- INDEX (media_id)
- INDEX (person_id)

---

### 6. duplicates (Потенциальные дубликаты)

**Назначение:** Система поиска и управления дубликатами персон

**Поля:**
- `id` - BIGINT, PRIMARY KEY, AUTO_INCREMENT
- `person1_id` - BIGINT, NOT NULL, FOREIGN KEY -> persons(id)
- `person2_id` - BIGINT, NOT NULL, FOREIGN KEY -> persons(id)
- `similarity_score` - DECIMAL(5,2), NOT NULL (0-100)
- `match_reasons` - JSON ({"name": 95, "birth_year": 100, "server": 80})
- `status` - ENUM('pending', 'confirmed', 'rejected', 'merged'), DEFAULT 'pending'
- `merge_strategy` - ENUM('keep_first', 'keep_second', 'merge_data') (что делать при слиянии)
- `reviewed_by` - INT
- `reviewed_at` - TIMESTAMP NULL
- `notes` - TEXT
- `created_at` - TIMESTAMP

**Индексы:**
- PRIMARY KEY (id)
- UNIQUE (person1_id, person2_id)
- INDEX (status)
- INDEX (similarity_score)
- INDEX (person1_id)
- INDEX (person2_id)

**Как работает слияние:**

**Случай 1: Один человек в трех базах (Иван Петров из Albaro, Fornezza, Santa Maria)**
```
persons:
  id=1, first_name="Иван", last_name="Петров", source_db="albaro", original_id=123
  id=2, first_name="Иван", last_name="Петров", source_db="fornezza", original_id=456
  id=3, first_name="Иван", last_name="Петров", source_db="santa-maria", original_id=789

duplicates:
  person1_id=1, person2_id=2, similarity_score=95, status='pending'
  person1_id=1, person2_id=3, similarity_score=93, status='pending'

После подтверждения и слияния:
  id=1, is_merged=false (основная запись)
  id=2, is_merged=true, merged_into_id=1
  id=3, is_merged=true, merged_into_id=1

primary_server_id обновляется на основной сервер (например, Albaro)
```

**Случай 2: Дубликаты внутри одной базы**
```
persons:
  id=10, first_name="Мария", last_name="Иванова", source_db="albaro", original_id=100
  id=11, first_name="Мария", last_name="Иванова", source_db="albaro", original_id=200

duplicates:
  person1_id=10, person2_id=11, similarity_score=98, status='pending'

После слияния:
  id=10, is_merged=false (основная)
  id=11, is_merged=true, merged_into_id=10
```

**Процесс слияния:**
1. Система автоматически находит похожих людей (по имени + год рождения)
2. Создается запись в `duplicates` со статусом 'pending'
3. Администратор проверяет и подтверждает или отклоняет
4. При подтверждении:
   - Выбирается основная запись (обычно с наиболее полными данными)
   - Дубликаты помечаются `is_merged=true` и `merged_into_id`
   - Все связи (фото, браки, дети) переносятся на основную запись
   - `primary_server_id` устанавливается на основной сервер
5. При запросах дубликаты автоматически игнорируются (WHERE is_merged = false)

---

### 7. audit_log (История изменений)

**Назначение:** Полная история всех изменений в системе

**Поля:**
- `id` - BIGINT, PRIMARY KEY, AUTO_INCREMENT
- `entity_type` - VARCHAR(50), NOT NULL (person, marriage, media, etc)
- `entity_id` - BIGINT, NOT NULL
- `action` - ENUM('create', 'update', 'delete', 'merge'), NOT NULL
- `old_values` - JSON
- `new_values` - JSON
- `user_id` - INT
- `ip_address` - VARCHAR(45)
- `user_agent` - TEXT
- `created_at` - TIMESTAMP

**Индексы:**
- PRIMARY KEY (id)
- INDEX (entity_type, entity_id)
- INDEX (action)
- INDEX (user_id)
- INDEX (created_at)

---

### 8. users (Пользователи)

**Назначение:** Пользователи системы с правами доступа

**Поля:**
- `id` - INT, PRIMARY KEY, AUTO_INCREMENT
- `username` - VARCHAR(100), UNIQUE, NOT NULL
- `email` - VARCHAR(255), UNIQUE
- `password_hash` - VARCHAR(255), NOT NULL
- `full_name` - VARCHAR(255)
- `avatar_url` - VARCHAR(500)
- `role` - ENUM('admin', 'editor', 'viewer'), DEFAULT 'viewer'
- `person_id` - BIGINT, FOREIGN KEY -> persons(id) (связь с персоной в древе)
- `is_active` - BOOLEAN, DEFAULT TRUE
- `email_verified` - BOOLEAN, DEFAULT FALSE
- `access_token` - VARCHAR(500)
- `refresh_token` - VARCHAR(500)
- `last_login_at` - TIMESTAMP NULL
- `created_at` - TIMESTAMP
- `updated_at` - TIMESTAMP

**Индексы:**
- PRIMARY KEY (id)
- UNIQUE (username)
- UNIQUE (email)
- INDEX (role)
- INDEX (is_active)

---

## Упрощенная модель родственных связей

### Почему mother_id и father_id лучше чем relationships таблица?

**1. Простота:**
- Всего 2 поля вместо сложной таблицы relationships
- Прямые foreign keys без промежуточных таблиц
- Понятная структура данных

**2. Производительность:**
- Нет JOIN - быстрее в 2-3 раза
- Индексы работают эффективнее
- Меньше нагрузка на БД

**3. Автоматическое вычисление связей:**
- **Дети**: `WHERE mother_id = X OR father_id = X`
- **Родители**: `WHERE id IN (person.mother_id, person.father_id)`
- **Братья/сестры**: `WHERE mother_id = person.mother_id OR father_id = person.father_id`
- **Сводные братья**: `WHERE mother_id = person.mother_id XOR father_id = person.father_id`
- **Бабушки/дедушки**: через JOIN с родителями
- **Внуки**: через JOIN с детьми

**4. Целостность данных:**
- Невозможно создать циклические зависимости
- Один человек = одна мать + один отец (биологическая модель)
- Четкая иерархия поколений

**5. Браки отдельно:**
- Таблица `marriages` для супругов с датами
- Не смешивается с кровными связями
- Поддержка нескольких браков
- История разводов

---

## Преимущества новой архитектуры

### 1. Производительность
- Индексы на всех поисковых полях
- Прямые связи через mother_id/father_id без JOIN
- Fulltext search для быстрого поиска
- Оптимизированная структура для рекурсивных запросов

### 2. Масштабируемость
- Нормализация уменьшает дублирование
- Soft delete сохраняет историю
- Audit log для отслеживания изменений
- Возможность партиционирования по серверам
- Объединение данных из нескольких источников (серверов)

### 3. Гибкость
- Разделение дат на year/month/day для неполных дат
- JSON поля для расширяемости (match_reasons, audit values, avatar_crop)
- Отслеживание источника данных через source_db и original_id
- Тегирование людей на медиа
- Аватар как ссылка на media с координатами обрезки

### 4. Целостность данных
- Foreign keys с правильными ON DELETE
- Unique constraints предотвращают дубли
- ENUM для ограничения значений
- NOT NULL где необходимо
- CHECK constraints для валидации

### 5. Удобство работы
- **Гибкие даты** - поддержка неполных дат (только год, год+месяц, полная дата)
- Система поиска дубликатов с оценкой схожести
- Версионирование через audit_log
- Soft delete для безопасного удаления
- Связь пользователей с персонами в древе

### Примеры работы с неполными датами

**Случай 1: Известен только год рождения (1950)**
```
birth_date = NULL
birth_year = 1950
birth_month = NULL
birth_day = NULL
```

**Случай 2: Известен год и месяц (март 1950)**
```
birth_date = NULL
birth_year = 1950
birth_month = 3
birth_day = NULL
```

**Случай 3: Полная дата (15 марта 1950)**
```
birth_date = '1950-03-15'
birth_year = 1950
birth_month = 3
birth_day = 15
```

**Преимущества:**
- Можно искать "всех родившихся в 1950 году" даже если точная дата неизвестна
- Дни рождения работают даже без полной даты (birth_month + birth_day)
- Сортировка по годам всегда возможна
- Нет потери информации

### Оптимизация аватаров

Вместо хранения отдельного файла аватара, используем ссылку на существующее фото из галереи:

**Преимущества:**
- Нет дублирования файлов
- Аватар всегда связан с исходным фото
- Можно изменить обрезку без загрузки нового файла
- История: если фото удалено, аватар тоже исчезнет

**Пример avatar_crop JSON:**
```json
{
  "x": 100,
  "y": 50,
  "width": 200,
  "height": 200
}
```

**Использование:**
1. Пользователь выбирает фото из галереи
2. В UI обрезает нужную область
3. Сохраняется `avatar_media_id` + координаты в `avatar_crop`
4. При отображении аватара берется исходное фото и обрезается по координатам

---

## Диаграмма связей

```
servers (ранее отдельные базы для каждого города)
  ↓ (1:N)
persons
  ↓ (self-reference)
  mother_id → persons
  father_id → persons
  ↓ (1:N)
  media
  ↓ (N:N через marriages)
  marriages
  ↓ (N:N через media_persons)
  media_persons
  ↓ (1:N)
  duplicates
  ↓ (1:1)
  users
```

---

## Миграция данных

### Этап 1: Создание новых таблиц
Выполнить CREATE TABLE для всех таблиц выше

### Этап 2: Миграция серверов
Создать 3 записи в таблице `servers`:
- code='albaro', name='Albaro', domain='albardaiforness.org'
- code='fornezza', name='Fornezza', domain='fornezza.org'
- code='santa-maria', name='Santa Maria', domain='santamaria.org'

### Этап 3: Миграция персон
Перенести данные из старой таблицы Person в новую persons с маппингом полей

### Этап 4: Миграция связей
- Обновить mother_id и father_id из таблицы Children
- Перенести данные из Marriages в новую таблицу marriages
- Удалить таблицу Brotherhood (братья вычисляются автоматически)

### Этап 5: Миграция медиа
Объединить Photo, File, Video в единую таблицу media с полем media_type

### Этап 6: Проверка и очистка
Проверить целостность данных, удалить временные таблицы

---

## Следующие шаги

1. ✅ Финальная схема базы данных
2. ⏳ Создать SQL миграции
3. ⏳ Обновить TypeORM entities
4. ⏳ Создать сервисы для работы с новой схемой
5. ⏳ Написать скрипт миграции данных
6. ⏳ Протестировать на тестовой базе
7. ⏳ Выполнить миграцию на production
