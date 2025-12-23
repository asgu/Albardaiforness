# Миграция медиафайлов (Photo и File)

## Обзор

Скрипт `migrate-media.ts` импортирует фотографии и файлы из старых баз данных Albaro и Preone в новую единую базу данных.

## Структура данных

### Старая БД

**Таблица Photo:**
- `id` - ID фотографии
- `person` - ID персоны (внешний ключ)
- `filePath` - путь к файлу (например: `100-1.jpg`)
- `description` - описание фотографии
- `prior` - порядок сортировки
- `marks` - метки персон на фото (сериализованный PHP массив)
- `is_private` - приватность (0 = публичная, 1 = приватная)

**Таблица File:**
- `id` - ID файла
- `person` - ID персоны (внешний ключ)
- `filePath` - путь к файлу (например: `117-4.pdf`)
- `description` - описание файла
- `fileName` - имя файла
- `prior` - порядок сортировки

### Новая БД (Prisma)

**Модель Media:**
```prisma
model Media {
  id            BigInt    @id @default(autoincrement())
  personId      BigInt?
  mediaType     MediaType // photo, document, video, audio, other
  filePath      String
  fileName      String
  fileSize      Int?
  mimeType      String?
  thumbnailPath String?
  title         String?
  description   String?
  dateTaken     DateTime?
  location      String?
  sortOrder     Int       @default(0)
  isPublic      Boolean   @default(true)
  isPrimary     Boolean   @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime?
  uploadedBy    Int?
}
```

## Процесс миграции

### 1. Подготовка

Убедитесь, что:
- ✅ Персоны уже импортированы (`migrate:albaro`, `migrate:preone`)
- ✅ Дампы находятся в папке `d/`:
  - `ad1.sql` - Albaro
  - `d2.sql` - Preone

### 2. Запуск миграции

```bash
cd api
npm run migrate:media
```

### 3. Что происходит

Для каждого сервера (Albaro, Preone):

1. **Загрузка дампа** - импорт таблиц Photo и File во временные таблицы
2. **Маппинг персон** - создание соответствия `originalId` → `personId`
3. **Импорт фотографий**:
   - Определение MIME типа по расширению
   - Конвертация `is_private` в `isPublic`
   - Сохранение `prior` как `sortOrder`
4. **Импорт файлов**:
   - Определение типа медиа по расширению (document, video, audio)
   - Определение MIME типа
   - Сохранение метаданных

### 4. Маппинг типов файлов

**Фотографии (Photo):**
- `.jpg`, `.jpeg` → `image/jpeg`
- `.png` → `image/png`
- `.gif` → `image/gif`
- `.webp` → `image/webp`

**Документы (File):**
- `.pdf` → `application/pdf` (document)
- `.doc`, `.docx` → `application/msword` (document)
- `.mp4`, `.avi`, `.mov` → `video/mp4` (video)
- `.mp3`, `.wav` → `audio/mpeg` (audio)

## Статистика

### Albaro (ad1.sql)
- Фотографий в дампе: ~366,827
- Файлов в дампе: ~23,065

### Preone (d2.sql)
- Фотографий в дампе: ~58,941
- Файлов в дампе: ~42

## Обработка ошибок

Скрипт пропускает медиафайлы, если:
- Персона не найдена в новой БД (по `originalId`)
- Ошибка создания записи в БД

Все ошибки логируются в консоль.

## Физические файлы

⚠️ **Важно:** Скрипт импортирует только метаданные медиафайлов в БД.

Физические файлы должны быть скопированы отдельно:

```bash
# Структура файлов на старом сервере
/var/www/albard/uploads/photos/  # Фотографии
/var/www/albard/uploads/files/   # Файлы

# Структура на новом сервере
/var/www/albard/uploads/photos/  # Фотографии
/var/www/albard/uploads/files/   # Файлы
```

## Миграция меток на фото

После импорта медиафайлов можно импортировать метки персон на фотографиях:

```bash
npm run migrate:photo-tags
```

### Что происходит:

1. **Парсинг PHP сериализованных данных** из колонки `marks`
2. **Извлечение координат** для каждой персоны на фото
3. **Конвертация координат** в проценты (для адаптивности)
4. **Создание записей** в таблице `MediaPerson`

### Формат меток

Колонка `marks` содержит PHP сериализованный массив:

```php
a:17:{
  i:2391;a:5:{
    i:0;s:3:"189";   // x координата (пиксели)
    i:1;s:3:"412";   // y координата (пиксели)
    i:2;s:3:"355";   // ширина рамки
    i:3;s:3:"474";   // высота рамки
    i:4;s:12:"tico' nerina"; // имя персоны
  }
}
```

Где ключ `i:2391` - это `originalId` персоны.

## Следующие шаги

После миграции медиафайлов и меток:

1. **Установить аватары персонам**:
   - Найти первую фотографию для каждой персоны
   - Установить как `avatarMediaId`

2. **Скопировать физические файлы** (опционально):
   - Синхронизировать папки `uploads/` со старого сервера
   - Пока используются URL на старый домен

## Пример использования

```bash
# Полная миграция данных
cd api

# 1. Импорт персон
npm run migrate:albaro
npm run migrate:preone

# 2. Исправление связей
npm run fix:albaro-links-fast
npm run fix:marriages

# 3. Импорт медиафайлов
npm run migrate:media

# 4. Проверка
npm run prisma:studio
```

## Проверка результатов

```sql
-- Количество медиафайлов по серверам
SELECT 
  s.name,
  COUNT(m.id) as media_count,
  m.mediaType
FROM media m
JOIN persons p ON m.personId = p.id
JOIN servers s ON p.primaryServerId = s.id
GROUP BY s.name, m.mediaType;

-- Персоны без медиафайлов
SELECT COUNT(*) 
FROM persons p
WHERE NOT EXISTS (
  SELECT 1 FROM media m WHERE m.personId = p.id
);

-- Персоны с аватарами
SELECT COUNT(*) 
FROM persons 
WHERE avatarMediaId IS NOT NULL;
```

## Troubleshooting

### Ошибка: "Сервер не найден"
Убедитесь, что серверы созданы в таблице `servers`:
```sql
SELECT * FROM servers WHERE code IN ('albaro', 'preone');
```

### Ошибка: "Person not found"
Сначала импортируйте персон:
```bash
npm run migrate:albaro
npm run migrate:preone
```

### Медиафайлы не отображаются
Проверьте:
1. Записи созданы в БД
2. Физические файлы скопированы
3. Права доступа к папке `uploads/`
4. Настройки Nginx для статических файлов

---

**Последнее обновление:** 2025-12-23

