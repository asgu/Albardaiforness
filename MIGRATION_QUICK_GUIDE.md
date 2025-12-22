# Быстрая шпаргалка по миграции данных

## Albaro (new.albardaiforness.org) - d/ad1.sql

### Полная миграция одной командой:

```bash
cd /Users/asgudev/Documents/Projects/albero && \
rsync -avz d/ad1.sql venezia:/tmp/ && \
cd api && \
rsync -avz src/scripts/migrate-albaro.ts src/scripts/fix-albaro-links-fast.ts venezia:/var/www/albard/api/src/scripts/ && \
ssh venezia "cd /var/www/albard/api && DUMP_PATH=/tmp/ad1.sql npx ts-node src/scripts/migrate-albaro.ts" && \
ssh venezia "mysql -u albard_new -pNH3q5QMHutdNvJDk albard_new -e 'DELETE m1 FROM marriages m1 INNER JOIN marriages m2 WHERE m1.id > m2.id AND ((m1.person1Id = m2.person1Id AND m1.person2Id = m2.person2Id) OR (m1.person1Id = m2.person2Id AND m1.person2Id = m2.person1Id));'" && \
ssh venezia "cd /var/www/albard/api && DUMP_PATH=/tmp/ad1.sql npx ts-node src/scripts/fix-albaro-links-fast.ts" && \
ssh venezia "rm -f /tmp/ad1.sql" && \
echo "✅ Миграция Albaro завершена!"
```

**Результат:**
- 33,215 персон
- 10,397 браков (без дубликатов)
- 27,682 матерей
- 27,449 отцов
- 5 пользователей

---

## Preone (new.alberodipreone.org) - d/d2.sql

### Полная миграция:

```bash
cd /Users/asgudev/Documents/Projects/albero && \
rsync -avz d/d2.sql venezia:/tmp/ && \
cd api && \
rsync -avz src/scripts/migrate-preone.ts venezia:/var/www/albard/api/src/scripts/ && \
ssh venezia "cd /var/www/albard/api && DUMP_PATH=/tmp/d2.sql npx ts-node src/scripts/migrate-preone.ts" && \
ssh venezia "rm -f /tmp/d2.sql" && \
echo "✅ Миграция Preone завершена!"
```

**Результат:**
- 5,136 персон
- 3,758 матерей
- 3,732 отцов

---

## Raveo (new.alberodiraveo.org) - d/d3.sql (если есть)

### Полная миграция:

```bash
cd /Users/asgudev/Documents/Projects/albero && \
rsync -avz d/d3.sql venezia:/tmp/ && \
cd api && \
rsync -avz src/scripts/migrate-raveo.ts venezia:/var/www/albard/api/src/scripts/ && \
ssh venezia "cd /var/www/albard/api && DUMP_PATH=/tmp/d3.sql npx ts-node src/scripts/migrate-raveo.ts" && \
ssh venezia "rm -f /tmp/d3.sql" && \
echo "✅ Миграция Raveo завершена!"
```

---

## Проверка результатов

```bash
ssh venezia "mysql -u albard_new -pNH3q5QMHutdNvJDk albard_new -e 'SELECT sourceDb, COUNT(*) as persons, SUM(CASE WHEN motherId IS NOT NULL THEN 1 ELSE 0 END) as mothers, SUM(CASE WHEN fatherId IS NOT NULL THEN 1 ELSE 0 END) as fathers FROM persons GROUP BY sourceDb;'"
```

---

## Очистка данных (если нужно переимпортировать)

### Удалить все данные Albaro:

```bash
ssh venezia "mysql -u albard_new -pNH3q5QMHutdNvJDk albard_new <<EOF
DELETE FROM persons WHERE sourceDb = 'albaro';
DELETE FROM marriages WHERE person1Id NOT IN (SELECT id FROM persons) OR person2Id NOT IN (SELECT id FROM persons);
EOF
"
```

### Удалить все данные Preone:

```bash
ssh venezia "mysql -u albard_new -pNH3q5QMHutdNvJDk albard_new <<EOF
DELETE FROM persons WHERE sourceDb = 'preone';
DELETE FROM marriages WHERE person1Id NOT IN (SELECT id FROM persons) OR person2Id NOT IN (SELECT id FROM persons);
EOF
"
```

### Очистить только связи родителей:

```bash
ssh venezia "mysql -u albard_new -pNH3q5QMHutdNvJDk albard_new -e 'UPDATE persons SET motherId = NULL, fatherId = NULL WHERE sourceDb = \"albaro\";'"
```

---

## Полезные команды

### Подключение к серверу:

```bash
ssh venezia
```

### Подключение к базе данных:

```bash
ssh venezia "mysql -u albard_new -pNH3q5QMHutdNvJDk albard_new"
```

### Проверка серверов:

```bash
ssh venezia "mysql -u albard_new -pNH3q5QMHutdNvJDk albard_new -e 'SELECT * FROM servers;'"
```

### Логи PM2:

```bash
ssh venezia "pm2 logs albero-api --lines 100"
```

---

## Документация

- **Подробная инструкция Albaro**: `api/ALBARO_MIGRATION.md`
- **Подробная инструкция Preone**: `api/PREONE_MIGRATION.md`
- **Дизайн базы данных**: `api/DATABASE_DESIGN.md`
- **Миграция пользователей**: `api/USER_MIGRATION.md`

---

**Последнее обновление:** 2025-12-22

