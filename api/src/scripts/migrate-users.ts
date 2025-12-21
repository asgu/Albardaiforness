/**
 * Миграция пользователей из старой таблицы fos_user в новую таблицу users
 * 
 * Старая структура (FOSUserBundle):
 * - Таблица: fos_user
 * - Пароли: SHA-512 в формате {hash}{salt}
 * - Поля: id, username, email, password, roles, region
 * 
 * Новая структура (Prisma):
 * - Таблица: users
 * - Пароли: сохраняем в том же формате для совместимости
 * - Поля: id, username, email, passwordHash, role
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface FOSUser {
  id: number;
  username: string;
  username_canonical: string;
  email: string;
  email_canonical: string;
  enabled: boolean;
  salt: string;
  password: string;
  last_login: Date | null;
  confirmation_token: string | null;
  password_requested_at: Date | null;
  roles: string;
  region: string;
  access_token: string | null;
}

/**
 * Определяет роль пользователя на основе roles из FOSUserBundle
 */
function mapRole(rolesJson: string): 'admin' | 'editor' | 'viewer' {
  try {
    const roles = JSON.parse(rolesJson);
    
    if (roles.includes('ROLE_SUPER_ADMIN') || roles.includes('ROLE_ADMIN')) {
      return 'admin';
    }
    
    if (roles.includes('ROLE_MANAGER')) {
      return 'editor';
    }
    
    return 'viewer';
  } catch (error) {
    console.error('Error parsing roles:', rolesJson, error);
    return 'viewer';
  }
}

async function migrateUsers() {
  console.log('🚀 Starting user migration from fos_user to users...\n');

  try {
    // Получаем всех пользователей из старой таблицы
    const fosUsers = await prisma.$queryRaw<FOSUser[]>`
      SELECT 
        id,
        username,
        username_canonical,
        email,
        email_canonical,
        enabled,
        salt,
        password,
        last_login,
        confirmation_token,
        password_requested_at,
        roles,
        region,
        access_token
      FROM fos_user
    `;

    console.log(`📊 Found ${fosUsers.length} users in fos_user table\n`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const fosUser of fosUsers) {
      try {
        // Проверяем, существует ли уже пользователь
        const existingUser = await prisma.user.findUnique({
          where: { username: fosUser.username },
        });

        if (existingUser) {
          console.log(`⏭️  Skipping ${fosUser.username} - already exists`);
          skipped++;
          continue;
        }

        // Определяем роль
        const role = mapRole(fosUser.roles);

        // Создаем пользователя
        await prisma.user.create({
          data: {
            username: fosUser.username,
            email: fosUser.email || null,
            passwordHash: fosUser.password, // Сохраняем в формате FOSUserBundle
            role: role,
            isActive: fosUser.enabled,
            emailVerified: fosUser.enabled,
            accessToken: fosUser.access_token || null,
            lastLoginAt: fosUser.last_login || null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        console.log(`✅ Migrated: ${fosUser.username} (${role})`);
        migrated++;
      } catch (error: any) {
        console.error(`❌ Error migrating ${fosUser.username}:`, error.message);
        errors++;
      }
    }

    console.log('\n📈 Migration Summary:');
    console.log(`   ✅ Migrated: ${migrated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   📊 Total: ${fosUsers.length}`);

    if (migrated > 0) {
      console.log('\n✨ User migration completed successfully!');
      console.log('💡 Users can now login with their existing credentials.');
      console.log('🔐 Passwords are preserved in FOSUserBundle SHA-512 format.');
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Запуск миграции
migrateUsers()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

