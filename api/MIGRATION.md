# Миграция данных из старых баз

## Обзор

Этот документ описывает процесс миграции данных из трех отдельных баз данных Symfony в единую базу данных с поддержкой Prisma.

## Структура старых баз

- **albard** - Albaro di Fornezza
- **fornezza** - Fornezza  
- **santa_maria** - Santa Maria

Каждая база содержит:
- Таблицу `person` с персонами
- Таблицу `marriage` с браками
- Таблицу `photo` с фотографиями
- Другие связанные таблицы

## Новая структура

Единая база `albard_new` с:
- Таблицей `servers` (ранее города)
- Таблицей `persons` с полем `primary_server_id`
- Полями `source_db` и `original_id` для отслеживания источника
- Системой поиска дубликатов

## Процесс миграции

### 1. Подготовка

Убедитесь, что:
- База данных создана: `npm run prisma:push`
- Переменные окружения настроены в `.env`
- Старые базы доступны

### 2. Запуск миграции

```bash
npm run migrate:data
```

Скрипт выполнит:
1. Создание серверов (Albaro, Fornezza, Santa Maria)
2. Импорт персон из каждой базы
3. Установку связей родителей (второй проход)
4. Импорт браков
5. Сохранение `source_db` и `original_id` для каждой персоны

### 3. Поиск дубликатов

После миграции запустите поиск дубликатов:

```bash
npm run find:duplicates
```

Скрипт:
- Проверит всех персон на схожесть
- Создаст записи в таблице `duplicates`
- Покажет топ-10 наиболее вероятных дубликатов

### 4. Обработка дубликатов

Дубликаты можно обработать через:

**API:**
```bash
# Получить список дубликатов
GET /api/duplicates

# Объединить дубликаты
POST /api/duplicates/:id/merge
{
  "strategy": "keep_first" | "keep_second" | "merge_data"
}

# Отклонить дубликат
POST /api/duplicates/:id/reject
```

**Prisma Studio:**
```bash
npm run prisma:studio
```

## Алгоритм поиска дубликатов

Сравнение по:
- Имя (30%)
- Фамилия (30%)
- Год рождения (20%)
- Дата рождения (10%)
- Год смерти (10%)

Используется:
- Точное совпадение
- Fuzzy matching (Levenshtein distance ≤ 2)
- Порог схожести: 70%

## Стратегии слияния

1. **keep_first** - оставить первую персону, удалить вторую
2. **keep_second** - оставить вторую персону, удалить первую
3. **merge_data** - объединить данные (оставить первую, добавить данные из второй)

При слиянии:
- Исходная персона помечается `is_merged = true`
- Устанавливается `merged_into_id`
- Все связи (фото, браки, дети) переносятся на целевую персону
- Дубликат помечается как `merged`

## Откат миграции

Если нужно откатить миграцию:

```sql
-- Удалить все данные
TRUNCATE TABLE persons CASCADE;
TRUNCATE TABLE marriages CASCADE;
TRUNCATE TABLE duplicates CASCADE;
TRUNCATE TABLE servers CASCADE;
```

Или пересоздать базу:

```bash
npm run prisma:push -- --force-reset
```

## Проверка результатов

```sql
-- Статистика по серверам
SELECT s.name, COUNT(p.id) as persons_count
FROM servers s
LEFT JOIN persons p ON p.primary_server_id = s.id
WHERE p.is_merged = false
GROUP BY s.id, s.name;

-- Дубликаты по статусу
SELECT status, COUNT(*) as count
FROM duplicates
GROUP BY status;

-- Персоны с дубликатами
SELECT 
  p.first_name, 
  p.last_name, 
  p.source_db,
  COUNT(d.id) as duplicates_count
FROM persons p
LEFT JOIN duplicates d ON (d.person1_id = p.id OR d.person2_id = p.id)
WHERE d.status = 'pending'
GROUP BY p.id
HAVING COUNT(d.id) > 0
ORDER BY duplicates_count DESC;
```

## Примечания

- Миграция сохраняет `source_db` и `original_id` для каждой персоны
- Один человек может быть в нескольких базах - система дубликатов это обработает
- После слияния исходные персоны не удаляются, а помечаются `is_merged = true`
- Все связи сохраняются при слиянии

## Troubleshooting

**Ошибка подключения к старой базе:**
- Проверьте переменные `OLD_DB_*` в `.env`
- Убедитесь, что база доступна

**Дублирующиеся персоны при повторном запуске:**
- Очистите базу перед повторным запуском
- Или используйте `upsert` вместо `create`

**Медленная работа:**
- Увеличьте `connectionLimit` в конфигурации пула
- Используйте batch операции для больших объемов данных

