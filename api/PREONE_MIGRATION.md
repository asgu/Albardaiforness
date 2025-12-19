# Миграция данных Albero di Preone

## Обзор

Миграция данных из старой базы alberodipreone.org в новую единую базу.

## Подготовка

### 1. Добавить сервер в базу данных

Если еще не добавлен:

```sql
INSERT INTO servers (code, name, fullName, color, domain, isActive, createdAt, updatedAt)
VALUES (
  'preone',
  'Preone',
  'Albero di Preone',
  '#FFB6C1',
  'new.alberodipreone.org',
  true,
  NOW(),
  NOW()
);
```

### 2. Обновить Nginx конфигурацию

Файл `/etc/nginx/sites-available/albero` на сервере должен включать домен `new.alberodipreone.org`:

```nginx
server_name new.albardaiforness.org new.alberodipreone.org;
```

### 3. Получить SSL сертификат

```bash
sudo certbot --nginx -d new.alberodipreone.org
```

## Структура старой базы

### Таблицы:
- `Person` - персоны (27,360 записей)
- `Marriages` - браки
- `Children` - связи родитель-ребенок
- `Brotherhood` - братья/сестры
- `Photo` - фотографии
- `File` - файлы
- `Video` - видео

### Особенности:
- Поле `sex`: 1 = мужчина, 0 = женщина
- Даты в формате `DD/MM` (без года) или `DD/MM/YYYY`
- Поле `status`: 1 = активная персона
- Поле `mirror`: ID зеркальной записи (дубликат)
- Поле `is_private`: приватная персона

## Запуск миграции

```bash
cd api
npm run migrate:preone
```

## Что делает скрипт

1. **Проверка сервера** - проверяет наличие сервера `preone` в таблице `servers`
2. **Создание временной БД** - создает `temp_preone_import`
3. **Загрузка дампа** - импортирует `d/d2.sql`
4. **Импорт персон** - переносит данные из `Person`:
   - Парсит даты рождения/смерти
   - Определяет пол
   - Сохраняет `source_db = 'preone'` и `original_id`
   - Учитывает `is_private`
5. **Связи родителей** - обновляет `mother_id` и `father_id` из таблицы `Children`
6. **Импорт браков** - переносит данные из `Marriages`
7. **Очистка** - удаляет временную базу

## Маппинг полей

### Person -> persons

| Старое поле | Новое поле | Преобразование |
|-------------|------------|----------------|
| firstName | firstName | - |
| lastName | lastName | - |
| nickname | nickName | - |
| birthYear | birthYear | parseInt() |
| birthDate | birthMonth, birthDay | split('/') |
| deathYear | deathYear | parseInt() |
| deathDate | deathMonth, deathDay | split('/') |
| sex | gender | 1→male, 0→female |
| occupation | occupation | - |
| birthPlace | birthPlace | - |
| deathPlace | deathPlace | - |
| note | note | - |
| privateNote | privateNote | - |
| is_private | isPublic | !is_private |
| id | originalId | - |
| - | sourceDb | 'preone' |
| - | primaryServerId | server.id |

### Marriages -> marriages

| Старое поле | Новое поле | Преобразование |
|-------------|------------|----------------|
| person_1 | person1Id | через personIdMap |
| person_2 | person2Id | через personIdMap |
| marriage_date | marriageYear | parse DD/MM/YYYY |
| divorce_date | isCurrent | !divorce_date |

## После миграции

### 1. Проверить данные

```sql
-- Статистика по Preone
SELECT COUNT(*) FROM persons WHERE source_db = 'preone';

-- Персоны без родителей
SELECT COUNT(*) FROM persons 
WHERE source_db = 'preone' 
AND mother_id IS NULL 
AND father_id IS NULL;

-- Браки
SELECT COUNT(*) FROM marriages m
JOIN persons p1 ON m.person1_id = p1.id
WHERE p1.source_db = 'preone';
```

### 2. Найти дубликаты

```bash
npm run find:duplicates
```

### 3. Импортировать галерею (опционально)

Дамп галереи находится в `d/d3.sql` (база `gallery_aprione`).

## Troubleshooting

**Ошибка: Сервер не найден**
```bash
# Добавьте сервер вручную через SQL
```

**Ошибка: Временная база уже существует**
```bash
# Скрипт автоматически удаляет ее перед созданием
```

**Неправильные даты**
```bash
# Скрипт игнорирует некорректные даты
# Проверьте логи для деталей
```

## Примечания

- Поле `mirror` (дубликаты) не импортируется - используйте систему поиска дубликатов
- Таблица `Brotherhood` не импортируется - связи определяются через общих родителей
- Фотографии, файлы и видео не импортируются в этом скрипте

