# Миграция данных Albaro (new.albardaiforness.org)

## Описание

Инструкция по импорту данных из дампа `d/ad1.sql` базы данных Albaro (new.albardaiforness.org) в единую базу данных проекта Albero.

## Особенности базы Albaro

1. **Связи родителей записаны наоборот**: В таблице `Children` поля `child` и `parent` перепутаны местами - `child` содержит ID родителя, а `parent` содержит ID ребенка.
2. **Дублирование браков**: При импорте браки могут дублироваться, требуется очистка.
3. **Большой объем данных**: ~33,000 персон, ~55,000 связей родителей, ~18,000 браков.

## Предварительные требования

1. Сервер `albaro` должен существовать в таблице `servers`:
```sql
SELECT * FROM servers WHERE code = 'albaro';
-- Должен вернуть: id=1, code='albaro', name='Albaro', domain='new.albardaiforness.org'
```

2. Дамп `d/ad1.sql` должен находиться в папке `d/` в корне проекта.

## Полная миграция (с нуля)

### Шаг 1: Загрузка дампа на сервер

```bash
cd /Users/asgudev/Documents/Projects/albero
rsync -avz --progress d/ad1.sql venezia:/tmp/
```

### Шаг 2: Загрузка скриптов на сервер

```bash
cd api
rsync -avz src/scripts/migrate-albaro.ts venezia:/var/www/albard/api/src/scripts/
rsync -avz src/scripts/fix-albaro-links-fast.ts venezia:/var/www/albard/api/src/scripts/
```

### Шаг 3: Импорт персон, браков и пользователей

```bash
ssh venezia "cd /var/www/albard/api && DUMP_PATH=/tmp/ad1.sql npx ts-node src/scripts/migrate-albaro.ts"
```

**Результат:**
- ✅ Импортировано ~33,215 персон
- ✅ Импортировано ~17,809 браков (с дубликатами)
- ✅ Импортировано ~5 пользователей

### Шаг 4: Удаление дубликатов браков

```bash
ssh venezia "mysql -u albard_new -pNH3q5QMHutdNvJDk albard_new <<EOF
DELETE m1 FROM marriages m1
INNER JOIN marriages m2 
WHERE m1.id > m2.id 
  AND ((m1.person1Id = m2.person1Id AND m1.person2Id = m2.person2Id) 
    OR (m1.person1Id = m2.person2Id AND m1.person2Id = m2.person1Id));
EOF
"
```

**Результат:**
- ✅ Удалено ~9,000 дубликатов (остается ~10,400 браков)

### Шаг 5: Импорт связей родителей (быстрый метод)

```bash
ssh venezia "cd /var/www/albard/api && DUMP_PATH=/tmp/ad1.sql npx ts-node src/scripts/fix-albaro-links-fast.ts"
```

**Результат:**
- ✅ Обновлено ~27,682 связей с матерями
- ✅ Обновлено ~27,449 связей с отцами

### Шаг 6: Очистка временного дампа

```bash
ssh venezia "rm -f /tmp/ad1.sql"
```

## Переимпорт связей родителей (если нужно исправить)

Если связи родителей импортированы неправильно:

### 1. Очистить существующие связи

```bash
ssh venezia "mysql -u albard_new -pNH3q5QMHutdNvJDk albard_new -e 'UPDATE persons SET motherId = NULL, fatherId = NULL WHERE sourceDb = \"albaro\";'"
```

### 2. Загрузить дамп (если удален)

```bash
rsync -avz --progress d/ad1.sql venezia:/tmp/
```

### 3. Запустить быстрый импорт связей

```bash
ssh venezia "cd /var/www/albard/api && DUMP_PATH=/tmp/ad1.sql npx ts-node src/scripts/fix-albaro-links-fast.ts"
```

## Проверка результатов

### Статистика по персонам

```bash
ssh venezia "mysql -u albard_new -pNH3q5QMHutdNvJDk albard_new -e 'SELECT sourceDb, COUNT(*) as persons, SUM(CASE WHEN motherId IS NOT NULL THEN 1 ELSE 0 END) as with_mother, SUM(CASE WHEN fatherId IS NOT NULL THEN 1 ELSE 0 END) as with_father FROM persons GROUP BY sourceDb;'"
```

**Ожидаемый результат:**
```
sourceDb  persons  with_mother  with_father
albaro    33215    27682        27449
preone    5136     3758         3732
```

### Статистика по бракам

```bash
ssh venezia "mysql -u albard_new -pNH3q5QMHutdNvJDk albard_new -e 'SELECT COUNT(*) as total_marriages FROM marriages;'"
```

**Ожидаемый результат:**
```
total_marriages
10397
```

### Проверка конкретной персоны

Пример: Adriano De Santa (ID: 12483)

```bash
ssh venezia "mysql -u albard_new -pNH3q5QMHutdNvJDk albard_new -e \"SELECT p.originalId, p.firstName, p.lastName, p.birthYear, m.originalId as mother_oid, m.firstName as mother_name, f.originalId as father_oid, f.firstName as father_name FROM persons p LEFT JOIN persons m ON p.motherId = m.id LEFT JOIN persons f ON p.fatherId = f.id WHERE p.originalId = 12483 AND p.sourceDb = 'albaro';\""
```

**Ожидаемый результат:**
```
originalId: 12483
firstName: adriano
lastName: de santa
birthYear: 2011
mother_oid: 12482 (Sviatlana, 1981)
father_oid: 8445 (Bruno, 1957)
```

## NPM команды

Для локального запуска (если база доступна локально):

```bash
# Полная миграция
npm run migrate:albaro

# Быстрый импорт связей родителей
npm run fix:albaro-links-fast

# Медленный импорт связей (не рекомендуется)
npm run fix:albaro-links
```

## Скрипты

1. **migrate-albaro.ts** - Основной скрипт миграции
   - Импортирует персоны
   - Импортирует браки (с дубликатами)
   - Импортирует пользователей
   - Время выполнения: ~2-3 минуты

2. **fix-albaro-links-fast.ts** - Быстрый импорт связей родителей
   - Загружает все данные в память
   - Использует batch updates
   - Учитывает перевернутую логику связей в старой БД
   - Время выполнения: ~1-2 минуты

3. **fix-albaro-links.ts** - Медленный импорт связей (устаревший)
   - Индивидуальные запросы для каждой связи
   - Время выполнения: ~30-60 минут
   - **Не рекомендуется использовать**

## Troubleshooting

### Проблема: "Table Children doesn't exist"

**Причина:** Таблица Children была удалена после предыдущего импорта.

**Решение:** Загрузить дамп заново:
```bash
rsync -avz d/ad1.sql venezia:/tmp/
```

### Проблема: Дублирующиеся браки

**Причина:** Скрипт migrate-albaro.ts импортирует браки без проверки дубликатов.

**Решение:** Выполнить SQL запрос из Шага 4 для удаления дубликатов.

### Проблема: Неправильные связи родителей (дети показаны как родители)

**Причина:** В старой базе Albaro связи в таблице Children записаны наоборот.

**Решение:** Использовать скрипт `fix-albaro-links-fast.ts`, который учитывает эту особенность.

### Проблема: Скрипт работает слишком долго

**Причина:** Используется медленный скрипт `fix-albaro-links.ts`.

**Решение:** Использовать `fix-albaro-links-fast.ts` вместо `fix-albaro-links.ts`.

## Полная команда для копирования (одна строка)

Для быстрого импорта с нуля:

```bash
cd /Users/asgudev/Documents/Projects/albero && \
rsync -avz d/ad1.sql venezia:/tmp/ && \
cd api && \
rsync -avz src/scripts/migrate-albaro.ts venezia:/var/www/albard/api/src/scripts/ && \
rsync -avz src/scripts/fix-albaro-links-fast.ts venezia:/var/www/albard/api/src/scripts/ && \
ssh venezia "cd /var/www/albard/api && DUMP_PATH=/tmp/ad1.sql npx ts-node src/scripts/migrate-albaro.ts" && \
ssh venezia "mysql -u albard_new -pNH3q5QMHutdNvJDk albard_new -e 'DELETE m1 FROM marriages m1 INNER JOIN marriages m2 WHERE m1.id > m2.id AND ((m1.person1Id = m2.person1Id AND m1.person2Id = m2.person2Id) OR (m1.person1Id = m2.person2Id AND m1.person2Id = m2.person1Id));'" && \
ssh venezia "cd /var/www/albard/api && DUMP_PATH=/tmp/ad1.sql npx ts-node src/scripts/fix-albaro-links-fast.ts" && \
ssh venezia "rm -f /tmp/ad1.sql" && \
echo "✅ Миграция Albaro завершена успешно!"
```

## История изменений

- **2025-12-22**: Создана документация
- **2025-12-22**: Исправлена логика импорта связей родителей (связи в старой БД записаны наоборот)
- **2025-12-22**: Создан оптимизированный скрипт fix-albaro-links-fast.ts
- **2025-12-22**: Добавлено удаление дубликатов браков

## Контакты

- Production: https://new.albardaiforness.org
- Server: venezia (185.251.38.72)
- Database: albard_new
- Персон в Albaro: 33,215

---

**Последнее обновление:** 2025-12-22

