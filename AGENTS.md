# Albero Project - Agent Instructions

## Project Overview

**Albero** - это веб-приложение для управления генеалогическим древом семьи с поддержкой нескольких серверов (городов).

### Технологический стек:

**Backend:**
- Node.js + Express.js
- TypeScript
- Prisma ORM (для MySQL)
- JWT аутентификация
- MySQL/MariaDB база данных
- PM2 для управления процессами

**Frontend:**
- Next.js 15+ (latest version, App Router, SSR)
- TypeScript
- React 19+
- SCSS (без Tailwind)
- Redux Toolkit (state management)
- next-intl (мультиязычность)
- axios (HTTP клиент)
- classnames (условные CSS классы)

**Legacy:**
- PHP Symfony 2 (старая версия, постепенно мигрируем на Node.js)

**Infrastructure:**
- Nginx (reverse proxy, SSL)
- Certbot (SSL сертификаты)
- Git + GitHub (версионирование)

## Правила разработки

### Принципы кода (DRY & SOLID)

**ВАЖНО:** Перед написанием нового кода:
1. ✅ **Поиск существующих решений** - проверить `frontend/src/types/`, `frontend/src/utils/`, `frontend/src/components/ui/`
2. ✅ **Переиспользование типов** - использовать существующие интерфейсы из `@/types` вместо дублирования
3. ✅ **Переиспользование компонентов** - использовать компоненты дизайн-системы и существующие компоненты
4. ✅ **Переиспользование утилит** - проверить наличие нужной функции в `@/utils` перед написанием новой
5. ✅ **DRY (Don't Repeat Yourself)** - избегать дублирования кода, интерфейсов, стилей
6. ✅ **Single Responsibility** - один компонент/функция = одна ответственность
7. ✅ **Open/Closed Principle** - компоненты открыты для расширения, закрыты для модификации

**Примеры:**
- ❌ **НЕ ДЕЛАТЬ:** Создавать локальный `interface Person` в компоненте
- ✅ **ДЕЛАТЬ:** Использовать `import { Person } from '@/types'`
- ❌ **НЕ ДЕЛАТЬ:** Копировать стили кнопки в новый компонент
- ✅ **ДЕЛАТЬ:** Использовать `<Button>` из дизайн-системы
- ❌ **НЕ ДЕЛАТЬ:** Писать функцию капитализации в каждом компоненте
- ✅ **ДЕЛАТЬ:** Использовать `capitalizeWords` из `@/utils/string`

### Интернационализация (i18n)

**ВАЖНО:** Все пользовательские строки должны быть переведены через `next-intl`:

1. ✅ **Использовать хук `useTranslations`** в каждом компоненте с текстом
2. ✅ **Все строки через `t()`** - никаких хардкод строк в JSX
3. ✅ **Добавлять ключи во все языки** - `it.json`, `ru.json`, `en.json`
4. ✅ **Группировать по разделам** - `common`, `search`, `person`, `timeline` и т.д.
5. ❌ **НЕ хардкодить** - избегать `"Ricerca"`, `"Loading..."`, `"Error"` в коде

**Примеры:**
- ❌ **НЕ ДЕЛАТЬ:** `<h1>Ricerca</h1>`
- ✅ **ДЕЛАТЬ:** `<h1>{t('search.title')}</h1>`
- ❌ **НЕ ДЕЛАТЬ:** `alert('Ошибка при сохранении')`
- ✅ **ДЕЛАТЬ:** `alert(t('common.saveError'))`
- ❌ **НЕ ДЕЛАТЬ:** `<Button>Отмена</Button>`
- ✅ **ДЕЛАТЬ:** `<Button>{t('common.cancel')}</Button>`

**Структура переводов:**
```typescript
// Импорт
import { useTranslations } from '@/i18n/useTranslations';

// Использование
const { t } = useTranslations();
const title = t('search.title');
```

### UI/UX
- ❌ **НЕ ИСПОЛЬЗОВАТЬ ЭМОДЖИ** в коде, компонентах и UI элементах
- ✅ Использовать только SCSS (миксины, переменные)
- ✅ Использовать дизайн-систему из `frontend/src/components/ui/`
- ✅ Минимизировать использование токенов
- ✅ Все кнопки и инпуты имеют высоту 44px
- ✅ Использовать `classnames` для условных CSS классов
- ✅ SSR для страниц персон (SEO)

### Архитектура
- ✅ Централизованные типы в `frontend/src/types/`
- ✅ Утилиты в `frontend/src/utils/`
- ✅ Компоненты дизайн-системы в `frontend/src/components/ui/`
- ✅ Переводы в `frontend/src/i18n/locales/`
- ✅ URL персон используют `originalId` для SEO и совместимости

## Структура проекта

```
albero/
├── api/                    # Node.js API сервер
│   ├── src/
│   │   ├── controllers/    # API контроллеры
│   │   ├── services/       # Бизнес-логика
│   │   ├── routes/         # API роуты
│   │   ├── middleware/     # Middleware (auth, etc)
│   │   ├── lib/            # Prisma client
│   │   └── scripts/        # Миграции и утилиты
│   ├── prisma/
│   │   └── schema.prisma   # Prisma схема
│   └── package.json
├── frontend/               # Next.js фронтенд
│   ├── src/
│   │   ├── app/            # Next.js App Router
│   │   ├── components/     # React компоненты
│   │   ├── store/          # Redux store
│   │   ├── types/          # TypeScript типы
│   │   ├── utils/          # Утилиты
│   │   ├── i18n/           # Переводы
│   │   └── styles/         # Глобальные стили
│   └── package.json
├── infrastructure/         # Конфигурация инфраструктуры
│   ├── nginx/              # Nginx конфиги
│   ├── pm2/                # PM2 конфиги
│   └── deploy.sh           # Скрипт деплоя
├── albard/                 # Symfony 2 (legacy, не в git)
├── albar/                  # Symfony 2 (legacy, не в git)
├── gallery/                # Symfony 6 (legacy, не в git)
├── push-deploy.sh          # Git push + deploy
└── AGENTS.md               # Этот файл
```

## Основные сущности

### Server (Сервер/Город)
- Серверы: albaro, preone, raveo
- Домены: new.albardaiforness.org, new.alberodipreone.org, new.alberodiraveo.org
- Каждый сервер имеет свой цвет для UI

### Person (Персона)
- Основная сущность - человек в генеалогическом древе
- Поля: firstName, lastName, nickName, birthYear/Month/Day, deathYear/Month/Day, gender, note, privateNote
- Связи: mother, father, children, spouses (через marriages), media
- Поддержка гибких дат (год/месяц/день могут быть null)
- `originalId` и `sourceDb` для отслеживания происхождения из старых БД
- `primaryServer` - основной сервер персоны

### Marriage (Брак)
- Связывает двух персон (person1, person2)
- Поля: marriageYear/Month/Day, divorceYear/Month/Day
- Гибкие даты

### Media (Медиа)
- Фотографии, документы, видео
- Связь с персонами через MediaPerson
- Используется для аватаров (avatarMediaId + avatarCrop)

### Duplicate (Дубликат)
- Система поиска и слияния дубликатов персон
- Алгоритм: имя + фамилия + год рождения
- Fuzzy matching с Levenshtein distance
- Поддержка слияния персон из разных источников

### User (Пользователь)
- Управление пользователями и авторизация
- Поля: username, email, passwordHash, role, isActive
- Роли: admin, editor, viewer
- Поддержка паролей из FOSUserBundle (SHA-512) и bcrypt
- JWT токены для аутентификации

## API Endpoints

### Аутентификация
- `POST /api/auth` - вход пользователя (JWT)
- Поддержка паролей: FOSUserBundle SHA-512 и bcrypt

### Персоны
- `GET /api/today` - дни рождения сегодня
- `GET /api/person/:id` - информация о персоне (поддерживает originalId)
- `GET /api/search?q=query&server=code` - поиск персон
- `GET /admin/person/load?ids=1,2,3` - загрузка по ID (auth)

### Серверы
- `GET /api/servers` - список серверов
- `GET /api/servers/:code` - информация о сервере
- `GET /api/servers/:code/persons` - персоны сервера

### Дубликаты
- `GET /api/duplicates` - список дубликатов (auth)
- `GET /api/persons/:id/duplicates` - найти дубликаты (auth)
- `POST /api/duplicates/:id/merge` - объединить персоны (auth)
- `POST /api/duplicates/:id/reject` - отклонить дубликат (auth)

## База данных

### Подключение
- Host: 127.0.0.1
- Port: 3306
- Database: albard_new
- User: albard_new
- Password: NH3q5QMHutdNvJDk

### Архитектура
Единая база данных с поддержкой мультитенантности через таблицу `servers`.
Ранее было 3 отдельные базы для каждого города - мигрировали к единой.

См. подробности в `api/DATABASE_DESIGN.md`

### Миграции

**Быстрая шпаргалка:** См. `MIGRATION_QUICK_GUIDE.md`

```bash
# Применить схему
npm run prisma:push

# Миграция данных Albaro (new.albardaiforness.org)
npm run migrate:albaro           # Персоны, браки, пользователи
npm run fix:albaro-links-fast    # Связи родителей (быстро)

# Миграция данных Preone (new.alberodipreone.org)
npm run migrate:preone           # Персоны, браки, связи

# Миграция медиафайлов (фото и файлы)
npm run migrate:media            # Photo и File из ad1.sql и d2.sql
npm run migrate:photo-tags       # Метки персон на фото (координаты)
npm run set:avatars              # Установка аватаров персонам

# Миграция пользователей из FOSUserBundle
npm run migrate:users

# Исправление связей (общие скрипты)
npm run fix:parent-links
npm run fix:marriages
```

**Важно для Albaro:**
- В старой базе связи родителей записаны наоборот (используйте `fix-albaro-links-fast.ts`)
- Браки дублируются при импорте (требуется удаление дубликатов)
- Подробности: `api/ALBARO_MIGRATION.md`

**Миграция медиафайлов:**
- Импорт фотографий и файлов из таблиц Photo и File
- Автоматическое определение типов файлов и MIME типов
- Связывание с персонами по originalId
- Подробности: `api/MEDIA_MIGRATION.md`

### Миграция пользователей
Старая система использовала FOSUserBundle (Symfony 2) с SHA-512 хешированием паролей.
Новая система поддерживает оба формата: SHA-512 (для мигрированных) и bcrypt (для новых).

См. подробности в `api/USER_MIGRATION.md`

## Деплой

### ⚠️ ВАЖНО: Единственный способ деплоя

**ВСЕГДА используй только эту команду для деплоя:**

```bash
./push-deploy.sh "Commit message"
```

**НЕ используй:**
- ❌ Прямые git команды + отдельный деплой
- ❌ `./infrastructure/deploy.sh` напрямую
- ❌ Ручной rsync
- ❌ Любые другие способы

### Что делает push-deploy.sh

Автоматически выполняет:
1. `git add .`
2. `git commit -m "message"`
3. `git push origin main`
4. `./infrastructure/deploy.sh` (локальный билд + загрузка + перезапуск)

Скрипт деплоя (`infrastructure/deploy.sh`) выполняет:
1. Локальный билд (API + Frontend)
2. Создание бэкапа на сервере
3. Загрузку через rsync
4. Установку зависимостей на сервере
5. Перезапуск PM2 процессов

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
rsync -avz ./infrastructure/nginx/albero.conf venezia:/etc/nginx/sites-available/
```

**3. На сервере:**
```bash
ssh venezia
cd /var/www/albard/api && npm install --production
cd /var/www/albard/frontend && npm install --production
pm2 restart albero-api
pm2 restart albero-frontend
sudo nginx -t && sudo systemctl reload nginx
```

### Конфигурация SSH

Добавить в `~/.ssh/config`:
```
Host venezia
    HostName 185.251.38.72
    User root
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
DATABASE_URL=mysql://albard_new:NH3q5QMHutdNvJDk@127.0.0.1:3306/albard_new
JWT_SECRET=your_production_secret_key
CORS_ORIGIN=https://new.albardaiforness.org,https://new.alberodipreone.org,https://new.alberodiraveo.org
```

**Frontend** (`/var/www/albard/frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=https://new.albardaiforness.org
```

### SSL Сертификаты

```bash
# Получить сертификаты для всех доменов
sudo certbot --nginx -d new.albardaiforness.org
sudo certbot --nginx -d new.alberodipreone.org
sudo certbot --nginx -d new.alberodiraveo.org

# Автообновление
sudo certbot renew --dry-run
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

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### Полезные команды

```bash
# TypeScript проверка
npm run build

# Prisma миграции
npm run prisma:push
npm run prisma:generate

# Поиск дубликатов
npm run find:duplicates

# Импорт данных
npm run migrate:preone
npm run fix:parent-links
npm run fix:marriages
```

## Важные заметки

1. **Пароли PHP vs Node.js**: Symfony использует FOSUserBundle с bcrypt. При аутентификации в Node.js нужно учитывать формат хеширования паролей.

2. **Миграция данных**: При импорте из трех старых баз нужно:
   - Создать серверы в таблице `servers`
   - Импортировать персоны с установкой `primaryServerId`
   - Запустить скрипты исправления связей
   - Запустить поиск дубликатов

3. **Uploads**: Файлы загружаются в `uploads/photos`, `uploads/files`, `uploads/gallery`

4. **CORS**: Настроить правильный origin для production

5. **originalId**: В URL используется `originalId` для SEO и совместимости с локальными Excel базами

## Roadmap

- [x] Создать Node.js API сервер
- [x] Реализовать основные endpoints
- [x] Добавить поддержку серверов (городов)
- [x] Реализовать систему дубликатов
- [x] Создать скрипты миграции данных
- [x] Создать Next.js фронтенд
- [x] Реализовать UI для поиска и просмотра персон
- [x] Деплой на production сервер
- [x] Настроить SSL сертификаты
- [x] Создать дизайн-систему компонентов
- [x] Добавить мультиязычность
- [ ] Реализовать UI для слияния дубликатов
- [ ] Добавить галерею
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

