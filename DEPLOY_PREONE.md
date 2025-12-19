# Деплой Albero di Preone

## Быстрый старт

### 1. Обновить Nginx на сервере

```bash
ssh venezia
sudo nano /etc/nginx/sites-available/albero
```

Добавить домен `new.alberodipreone.org` в `server_name`:

```nginx
server_name new.albardaiforness.org new.alberodipreone.org;
```

Проверить и перезагрузить:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 2. Получить SSL сертификат

```bash
sudo certbot --nginx -d new.alberodipreone.org
```

### 3. Добавить сервер в БД (если еще не добавлен)

```bash
mysql -u albard_new -p albard_new
```

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

### 4. Загрузить дампы на сервер

```bash
# Локально
cd /Users/asgudev/Documents/Projects/albero
scp -r d/ venezia:/var/www/albard/
```

### 5. Запустить миграцию на сервере

```bash
ssh venezia
cd /var/www/albard/api
npm run migrate:preone
```

### 6. Найти дубликаты

```bash
npm run find:duplicates
```

### 7. Проверить

```bash
curl https://new.alberodipreone.org/api/health
```

## Готово! 🎉

Сайт доступен по адресу: https://new.alberodipreone.org

