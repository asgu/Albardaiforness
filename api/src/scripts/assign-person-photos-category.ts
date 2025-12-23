/**
 * Скрипт для назначения категории "Фото персон" всем медиафайлам персон
 */

import { prisma } from '../lib/prisma';

async function assignPersonPhotosCategory() {
  console.log('🔄 Назначение категории "Фото персон" медиафайлам персон...\n');

  // Для каждого сервера
  const servers = await prisma.server.findMany({
    where: { isActive: true },
  });

  for (const server of servers) {
    console.log(`📁 Обработка сервера: ${server.name} (${server.code})`);

    // Получить или создать категорию "Фото персон"
    let category = await prisma.category.findFirst({
      where: {
        serverId: server.id,
        title: 'Фото персон',
        isDeleted: false,
      },
    });

    if (!category) {
      category = await prisma.category.create({
        data: {
          serverId: server.id,
          title: 'Фото персон',
          isDeleted: false,
        },
      });
      console.log(`   ✅ Создана категория "Фото персон"`);
    } else {
      console.log(`   ℹ️  Категория "Фото персон" уже существует (ID: ${category.id})`);
    }

    // Найти все медиафайлы персон этого сервера без категории
    const mediaWithoutCategory = await prisma.media.findMany({
      where: {
        personId: { not: null },
        categoryId: null,
        deletedAt: null,
        person: {
          primaryServerId: server.id,
        },
      },
      select: {
        id: true,
      },
    });

    console.log(`   📊 Найдено медиафайлов без категории: ${mediaWithoutCategory.length}`);

    if (mediaWithoutCategory.length > 0) {
      // Обновить медиафайлы батчами (по 500 штук)
      const batchSize = 500;
      let updated = 0;

      for (let i = 0; i < mediaWithoutCategory.length; i += batchSize) {
        const batch = mediaWithoutCategory.slice(i, i + batchSize);
        
        const result = await prisma.media.updateMany({
          where: {
            id: {
              in: batch.map(m => m.id),
            },
          },
          data: {
            categoryId: category.id,
          },
        });

        updated += result.count;
        console.log(`   ⏳ Обновлено ${updated} из ${mediaWithoutCategory.length}...`);
      }

      console.log(`   ✅ Обновлено медиафайлов: ${updated}\n`);
    } else {
      console.log(`   ℹ️  Нет медиафайлов для обновления\n`);
    }
  }

  console.log('✅ Назначение категорий завершено!');
}

assignPersonPhotosCategory()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

