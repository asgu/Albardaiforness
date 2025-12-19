#!/bin/bash
set -e

echo "🚀 Деплой миграции Preone..."

# 1. Загрузка файлов на сервер
echo "📤 Загрузка файлов на сервер..."
scp preone-migration.tar.gz venezia:/var/www/albard/

# 2. Распаковка и запуск на сервере
echo "📦 Распаковка и запуск миграции..."
ssh venezia << 'ENDSSH'
cd /var/www/albard
tar -xzf preone-migration.tar.gz
cd api
npm run migrate:preone
ENDSSH

echo "✅ Миграция завершена!"
