# Albero Project - Agent Instructions

## Project Overview

**Albero** - это веб-приложение для управления генеалогическим древом семьи с поддержкой нескольких городов.

### Технологический стек:

**Backend:**
- Node.js + Express.js
- TypeScript
- TypeORM (ORM для MySQL)
- JWT аутентификация
- MySQL/MariaDB база данных

**Frontend:**
- Next.js (latest version)
- TypeScript
- React
- SCSS (без Tailwind)
- Redux Toolkit (state management)

**Legacy:**
- PHP Symfony 2 (старая версия, постепенно мигрируем на Node.js)

## Правила разработки

### UI/UX
- ❌ **НЕ ИСПОЛЬЗОВАТЬ ЭМОДЖИ** в коде, компонентах и UI элементах
- ✅ Использовать только SCSS (миксины, переменные)
- ✅ Использовать дизайн-систему из `frontend/src/components/ui/`
- ✅ Минимизировать использование токенов

## Структура проекта

```
albero/
├── api/              # Node.js API сервер (новый)
│   ├── src/
│   │   ├── entities/      # TypeORM модели
│   │   ├── controllers/   # Контроллеры
│   │   ├── services/      # Бизнес-логика
│   │   ├── routes/        # API роуты
│   │   └── middleware/    # Middleware (auth, etc)
│   └── package.json
├── albard/           # Symfony 2 проект (legacy)
├── albar/            # Symfony 2 проект (legacy)
├── gallery/          # Галерея (Symfony 6)
└── AGENTS.md         # Этот файл
```

## Основные сущности

### Person (Персона)
- Основная сущность - человек в генеалогическом древе
- Поля: firstName, lastName, birthYear, birthDate, deathYear, avatar, etc.
- Связи: parents, children, spouses (marriages), photos, files, videos
- Поддержка нескольких городов через PersonCityLink

### City (Город)
- Города: Albaro, Fornezza, Santa Maria
- Одна персона может быть связана с несколькими городами

### PersonDuplicate
- Система поиска и слияния дубликатов персон
- Алгоритм сравнения: имя + фамилия + год рождения
- Fuzzy matching с Levenshtein distance

## API Endpoints

### Аутентификация
- `POST /api/auth` - вход пользователя (JWT)

### Персоны
- `GET /api/today` - дни рождения сегодня
- `GET /person/:id` - информация о персоне
- `GET /search?q=query&city=code` - поиск персон
- `GET /admin/person/load?ids=1,2,3` - загрузка по ID (auth)

### Города
- `GET /api/cities` - список городов
- `GET /api/cities/:code` - информация о городе
- `GET /api/cities/:code/persons` - персоны города

### Дубликаты
- `GET /api/duplicates` - список дубликатов (auth)
- `GET /api/persons/:id/duplicates` - найти дубликаты (auth)
- `POST /api/duplicates/:id/merge` - объединить персоны (auth)
- `POST /api/duplicates/:id/reject` - отклонить дубликат (auth)

### Галерея
- `GET /gallery` - список файлов галереи

## База данных

### Подключение
- Host: 127.0.0.1
- Port: 3306
- Database: albard_new
- User: root
- Password: в `.env` файле (NH3q5QMHutdNvJDk)

### Миграция к единой БД
Ранее было 3 отдельные базы для каждого города. Сейчас мигрируем к единой базе с поддержкой мультитенантности.

См. подробности в `api/MIGRATION_PLAN.md`

## Деплой

### Автоматический деплой

```bash
./infrastructure/deploy.sh
```

Скрипт автоматически выполняет сборку, загрузку на сервер и перезапуск сервисов.

### Процесс деплоя

**1. Локальный билд:**
```bash
cd api && npm run build
cd ../frontend && npm run build
```

**2. Загрузка на сервер через rsync:**
```bash
# SSH алиас: venezia
# Deploy path: /var/www/albard

rsync -avz --exclude='node_modules' --exclude='.env' ./api/ venezia:/var/www/albard/api/
rsync -avz --exclude='node_modules' --exclude='.env.local' ./frontend/ venezia:/var/www/albard/frontend/
```

**3. На сервере:**
```bash
ssh venezia
cd /var/www/albard/api && npm install --production
cd /var/www/albard/frontend && npm install --production
pm2 restart albero-api
pm2 restart albero-frontend
```

### Конфигурация SSH

Добавить в `~/.ssh/config`:
```
Host venezia
    HostName your-server-ip
    User your-username
    Port 22
    IdentityFile ~/.ssh/id_rsa
```

### Environment Variables

**API** (`/var/www/albard/api/.env`):
```env
NODE_ENV=production
PORT=3300
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=albard_new
DB_USER=albard_new
DB_PASSWORD=NH3q5QMHutdNvJDk
JWT_SECRET=your_production_secret_key
CORS_ORIGIN=https://new.albardaiforness.org
```

**Frontend** (`/var/www/albard/frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=https://new.albardaiforness.org
```

## Разработка

### Запуск локально

**API сервер:**
```bash
cd api
npm install
cp env.example .env
# Настроить .env
npm run dev
```

**Frontend (когда будет создан):**
```bash
cd frontend
npm install
npm run dev
```

### Полезные команды

```bash
# TypeScript проверка
npm run build

# TypeORM миграции
npm run migration:generate -- MigrationName
npm run migration:run
npm run migration:revert

# Поиск дубликатов (когда скрипт будет создан)
npm run find-duplicates

# Импорт данных (когда скрипт будет создан)
npm run import-data
```

## Важные заметки

1. **Пароли PHP vs Node.js**: Symfony использует FOSUserBundle с bcrypt. При аутентификации в Node.js нужно учитывать формат хеширования паролей.

2. **Миграция данных**: При импорте из трех старых баз нужно:
   - Создать города в таблице City
   - Импортировать персоны с установкой cityId
   - Создать PersonCityLink для связей
   - Запустить поиск дубликатов

3. **Uploads**: Файлы загружаются в `uploads/photos`, `uploads/files`, `uploads/gallery`

4. **CORS**: Настроить правильный origin для production

## Roadmap

- [x] Создать Node.js API сервер
- [x] Реализовать основные endpoints
- [x] Добавить поддержку городов
- [x] Реализовать систему дубликатов
- [ ] Создать скрипты миграции данных
- [ ] Создать Next.js фронтенд
- [ ] Реализовать UI для слияния дубликатов
- [ ] Деплой на production сервер
- [ ] Настроить CI/CD

## Контакты и ссылки

- Production: https://new.albardaiforness.org
- Server: venezia
- Deploy path: /var/www/albard

## Порты

- **Frontend (Next.js)**: 3301
- **Backend (Node.js API)**: 3300
- **Database (MySQL)**: 3306

---

**Последнее обновление:** 2025-12-19

