# Albero API Server

Node.js API server для генеалогического древа Albero с использованием **Prisma ORM**.

## Технологии

- **Node.js** + **Express.js**
- **TypeScript**
- **Prisma ORM** (MySQL/MariaDB)
- **JWT** аутентификация
- **bcryptjs** для хеширования паролей
- **multer** + **sharp** для загрузки изображений

## Установка

```bash
npm install
```

## Конфигурация

Создайте `.env` файл на основе `env.example`:

```bash
cp env.example .env
```

Основные переменные:

```env
NODE_ENV=development
PORT=3300

# Database
DATABASE_URL="mysql://user:password@localhost:3306/albard_new"

# JWT
JWT_SECRET=your_secret_key

# CORS
CORS_ORIGIN=http://localhost:3301
```

## База данных

### Генерация Prisma Client

```bash
npm run prisma:generate
```

### Создание миграций

```bash
npm run prisma:migrate
```

### Push схемы в БД (без миграций)

```bash
npm run prisma:push
```

### Prisma Studio (GUI для БД)

```bash
npm run prisma:studio
```

## Разработка

```bash
npm run dev
```

Сервер запустится на `http://localhost:3300`

## Production Build

```bash
npm run build
npm start
```

## Деплой

```bash
npm run deploy
```

Автоматически:
1. Собирает проект локально
2. Загружает на сервер через rsync
3. Устанавливает зависимости
4. Перезапускает PM2

## API Endpoints

### Health Check
- `GET /api/health` - проверка работоспособности

### Аутентификация
- `POST /api/auth` - вход пользователя (JWT)

### Персоны
- `GET /api/today` - дни рождения сегодня
- `GET /person/:id` - информация о персоне
- `GET /search?q=query&server=code` - поиск персон

### Серверы (города)
- `GET /api/servers` - список серверов
- `GET /api/servers/:code` - информация о сервере
- `GET /api/servers/:code/persons` - персоны сервера

### Дубликаты (требуется авторизация)
- `GET /api/duplicates` - список дубликатов
- `GET /api/persons/:id/duplicates` - найти дубликаты
- `POST /api/duplicates/:id/merge` - объединить персоны
- `POST /api/duplicates/:id/reject` - отклонить дубликат

## Структура проекта

```
api/
├── prisma/
│   ├── schema.prisma       # Prisma схема
│   └── migrations/         # Миграции БД
├── src/
│   ├── lib/
│   │   └── prisma.ts       # Prisma Client инстанс
│   ├── controllers/        # Контроллеры
│   ├── services/           # Бизнес-логика
│   ├── routes/             # API роуты
│   ├── middleware/         # Middleware (auth, etc)
│   └── index.ts            # Точка входа
├── .env                    # Переменные окружения
├── package.json
└── tsconfig.json
```

## Prisma Schema

Основные модели:

- **Server** - серверы (ранее города)
- **Person** - персоны с гибкими датами
- **Marriage** - браки
- **Media** - медиафайлы (фото, видео, документы)
- **MediaPerson** - тегирование людей на фото
- **Duplicate** - система поиска дубликатов
- **AuditLog** - история изменений
- **User** - пользователи

См. подробности в `DATABASE_DESIGN.md`

## Миграция с TypeORM на Prisma

✅ **Выполнено:**
- Установлен Prisma
- Создана схема на основе финальной архитектуры
- Удален TypeORM и зависимости
- Обновлены скрипты в package.json

## Лицензия

MIT
