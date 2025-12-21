# Миграция пользователей из FOSUserBundle

## Обзор

Старая система использовала Symfony 2 с FOSUserBundle для управления пользователями. Пароли хранились в формате SHA-512 с солью.

## Формат паролей FOSUserBundle

```
{encoded_hash}{salt}
```

Пример:
```
{5FZ8ehEApvSDkDFVnDHQjnNh2B1Jb7K8qvN3vXJZ1234567890abcdefghijklmnopqrstuvwxyz}{random_salt_string}
```

## Структура таблиц

### Старая таблица (fos_user)
```sql
CREATE TABLE fos_user (
  id INT PRIMARY KEY,
  username VARCHAR(180) UNIQUE,
  username_canonical VARCHAR(180) UNIQUE,
  email VARCHAR(180),
  email_canonical VARCHAR(180),
  enabled TINYINT(1),
  salt VARCHAR(255),
  password VARCHAR(255),
  last_login DATETIME,
  roles LONGTEXT,
  region VARCHAR(255),
  access_token VARCHAR(255)
);
```

### Новая таблица (users)
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(100) UNIQUE,
  email VARCHAR(255),
  passwordHash VARCHAR(255),
  role ENUM('admin', 'editor', 'viewer'),
  isActive BOOLEAN,
  emailVerified BOOLEAN,
  accessToken VARCHAR(500),
  lastLoginAt DATETIME,
  createdAt DATETIME,
  updatedAt DATETIME
);
```

## Маппинг ролей

- `ROLE_SUPER_ADMIN`, `ROLE_ADMIN` → `admin`
- `ROLE_MANAGER` → `editor`
- `ROLE_USER` → `viewer`

## Запуск миграции

```bash
cd api
npm run migrate:users
```

## Как работает авторизация

AuthService поддерживает оба формата паролей:

1. **FOSUserBundle SHA-512** (для мигрированных пользователей)
   - Определяется по наличию `{` и `}` в хеше
   - Проверка через `crypto.createHash('sha512')`

2. **BCrypt** (для новых пользователей)
   - Стандартный формат bcrypt
   - Проверка через `bcrypt.compare()`

## Пример использования

После миграции пользователи могут войти с теми же учетными данными:

```typescript
// POST /api/auth
{
  "username": "admin",
  "password": "old_password"
}

// Response
{
  "token": "jwt_token_here"
}
```

## Безопасность

- Пароли остаются в зашифрованном виде
- Поддержка старого формата для совместимости
- Новые пользователи используют более безопасный bcrypt
- JWT токены для сессий

