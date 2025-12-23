/**
 * Скрипт для очистки базы данных (кроме таблицы servers)
 */

import { prisma } from '../lib/prisma';

async function clearDatabase() {
  console.log('🗑️  Очистка базы данных...\n');

  try {
    // Отключаем проверку внешних ключей
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0');

    // Очищаем все таблицы кроме servers
    console.log('⏳ Очистка таблицы media_persons...');
    await prisma.mediaPerson.deleteMany({});
    
    console.log('⏳ Очистка таблицы media_tags...');
    await prisma.mediaTag.deleteMany({});
    
    console.log('⏳ Очистка таблицы media...');
    await prisma.media.deleteMany({});
    
    console.log('⏳ Очистка таблицы categories...');
    await prisma.category.deleteMany({});
    
    console.log('⏳ Очистка таблицы tags...');
    await prisma.tag.deleteMany({});
    
    console.log('⏳ Очистка таблицы marriages...');
    await prisma.marriage.deleteMany({});
    
    console.log('⏳ Очистка таблицы persons...');
    await prisma.person.deleteMany({});
    
    console.log('⏳ Очистка таблицы duplicates...');
    await prisma.duplicate.deleteMany({});
    
    console.log('⏳ Очистка таблицы users...');
    await prisma.user.deleteMany({});

    // Включаем проверку внешних ключей обратно
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1');

    console.log('\n✅ База данных очищена (таблица servers сохранена)!');
    console.log('\n📊 Статистика:');
    
    const serverCount = await prisma.server.count();
    console.log(`   Серверов: ${serverCount}`);
    
  } catch (error) {
    console.error('❌ Ошибка при очистке базы данных:', error);
    throw error;
  }
}

clearDatabase()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

