# Albero Infrastructure

Конфигурация инфраструктуры для проекта Albero.

## Структура

```
infrastructure/
├── nginx/              # Nginx конфигурация
│   ├── albero.conf    # Основной конфиг
│   └── README.md      # Инструкции по установке
├── pm2/               # PM2 конфигурация
│   └── ecosystem.config.js
├── deploy.sh          # Скрипт деплоя
└── README.md          # Этот файл
```

## Порты

- **Frontend (Next.js)**: 3301
- **Backend (Node.js API)**: 3300

## Домен

- **Production**: `new.albardaiforness.org`

## Деплой

### Автоматический деплой

```bash
./infrastructure/deploy.sh
```

Скрипт выполняет:
1. Сборку API (TypeScript → JavaScript)
2. Сборку Frontend (Next.js build)
3. Создание бэкапа на сервере
4. Загрузку файлов через rsync
5. Установку зависимостей на сервере
6. Перезапуск PM2 сервисов

### Ручной деплой

#### API
```bash
cd api
npm run build
rsync -avz --exclude='node_modules' --exclude='.env' ./api/ venezia:/var/www/albard/api/
ssh venezia "cd /var/www/albard/api && npm install --production && pm2 restart albero-api"
```

#### Frontend
```bash
cd frontend
npm run build
rsync -avz --exclude='node_modules' --exclude='.env.local' ./frontend/ venezia:/var/www/albard/frontend/
ssh venezia "cd /var/www/albard/frontend && npm install --production && pm2 restart albero-frontend"
```

## Первоначальная настройка сервера

### 1. Установка Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Установка PM2
```bash
sudo npm install -g pm2
pm2 startup systemd
```

### 3. Установка Nginx
```bash
sudo apt install nginx
sudo cp infrastructure/nginx/albero.conf /etc/nginx/sites-available/albero
sudo ln -s /etc/nginx/sites-available/albero /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. SSL сертификат
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d new.albardaiforness.org
```

### 5. Создание структуры директорий
```bash
sudo mkdir -p /var/www/albard/{api,frontend,uploads,logs,backups}
sudo chown -R $USER:$USER /var/www/albard
```

### 6. Environment файлы

**API** (`/var/www/albard/api/.env`):
```env
NODE_ENV=production
PORT=3300
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=albard_new
DB_USER=root
DB_PASSWORD=NH3q5QMHutdNvJDk
JWT_SECRET=your_production_secret_key_here
CORS_ORIGIN=https://new.albardaiforness.org
```

**Frontend** (`/var/www/albard/frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=https://new.albardaiforness.org
```

### 7. Запуск приложений
```bash
cd /var/www/albard
pm2 start infrastructure/pm2/ecosystem.config.js
pm2 save
```

## Мониторинг

### PM2
```bash
pm2 list                    # Список процессов
pm2 logs                    # Логи всех процессов
pm2 logs albero-api         # Логи API
pm2 logs albero-frontend    # Логи Frontend
pm2 monit                   # Мониторинг в реальном времени
```

### Nginx
```bash
sudo tail -f /var/log/nginx/albero-access.log
sudo tail -f /var/log/nginx/albero-error.log
```

### Системные логи
```bash
tail -f /var/www/albard/logs/api-error.log
tail -f /var/www/albard/logs/frontend-error.log
```

## Бэкапы

Бэкапы создаются автоматически при каждом деплое в `/var/www/albard/backups/`

### Восстановление из бэкапа
```bash
cd /var/www/albard
tar -xzf backups/backup_YYYYMMDD_HHMMSS.tar.gz
pm2 restart all
```

## Обновление зависимостей

```bash
ssh venezia
cd /var/www/albard/api
npm update
cd /var/www/albard/frontend
npm update
pm2 restart all
```

## Troubleshooting

### Проверка портов
```bash
sudo netstat -tlnp | grep -E '3300|3301'
```

### Проверка процессов
```bash
ps aux | grep node
```

### Перезапуск всех сервисов
```bash
pm2 restart all
sudo systemctl restart nginx
```

### Очистка логов
```bash
pm2 flush
sudo truncate -s 0 /var/log/nginx/albero-*.log
```

