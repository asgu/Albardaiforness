/**
 * Скрипт поиска дубликатов после миграции
 * 
 * Использование:
 * npx ts-node src/scripts/find-duplicates.ts
 */

import { prisma } from '../lib/prisma';
import { DuplicateService } from '../services/DuplicateService';
import * as dotenv from 'dotenv';

dotenv.config();

async function findAllDuplicates() {
  console.log('🔍 Поиск дубликатов...\n');

  const duplicateService = new DuplicateService();

  try {
    // Получаем всех персон
    const persons = await prisma.person.findMany({
      where: {
        isMerged: false,
      },
      orderBy: { id: 'asc' },
    });

    console.log(`📊 Найдено ${persons.length} персон для проверки\n`);

    let totalDuplicates = 0;
    let checked = 0;

    for (const person of persons) {
      try {
        const duplicates = await duplicateService.findDuplicates(person.id, 70);
        
        if (duplicates.length > 0) {
          console.log(`✓ ${person.firstName} ${person.lastName} (${person.id}): найдено ${duplicates.length} дубликатов`);
          totalDuplicates += duplicates.length;
        }

        checked++;
        if (checked % 100 === 0) {
          console.log(`   Проверено ${checked}/${persons.length} персон...`);
        }
      } catch (error) {
        console.error(`⚠️  Ошибка проверки персоны ${person.id}:`, error);
      }
    }

    console.log(`\n\n🎉 Поиск завершен!`);
    console.log(`📊 Статистика:`);
    console.log(`   Проверено персон: ${checked}`);
    console.log(`   Найдено дубликатов: ${totalDuplicates}`);

    // Показываем топ дубликатов
    const topDuplicates = await prisma.duplicate.findMany({
      where: { status: 'pending' },
      include: {
        person1: {
          select: {
            firstName: true,
            lastName: true,
            birthYear: true,
          },
        },
        person2: {
          select: {
            firstName: true,
            lastName: true,
            birthYear: true,
          },
        },
      },
      orderBy: { similarityScore: 'desc' },
      take: 10,
    });

    if (topDuplicates.length > 0) {
      console.log(`\n📋 Топ-10 дубликатов по схожести:\n`);
      topDuplicates.forEach((dup, index) => {
        console.log(`${index + 1}. ${dup.similarityScore}% - ${dup.person1.firstName} ${dup.person1.lastName} (${dup.person1.birthYear || '?'}) ↔️ ${dup.person2.firstName} ${dup.person2.lastName} (${dup.person2.birthYear || '?'})`);
      });
    }

  } catch (error) {
    console.error('\n❌ Ошибка поиска дубликатов:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Запуск скрипта
if (require.main === module) {
  findAllDuplicates()
    .then(() => {
      console.log('\n✅ Скрипт завершен');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Скрипт завершен с ошибкой:', error);
      process.exit(1);
    });
}

export { findAllDuplicates };

