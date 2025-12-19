/**
 * Скрипт для восстановления браков из старых дампов
 * Использует originalId для сопоставления персон
 */

import { prisma } from '../lib/prisma';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

async function fixMarriages() {
  console.log('💍 Восстановление браков...\n');

  try {
    // Парсим дамп d2.sql для извлечения данных Marriages
    console.log('📥 Чтение дампа d2.sql...');
    const dumpPath = path.join(process.cwd(), '../d/d2.sql');
    
    if (!fs.existsSync(dumpPath)) {
      console.error('❌ Файл d2.sql не найден!');
      return;
    }

    const dumpSql = fs.readFileSync(dumpPath, 'utf8');
    
    // Извлекаем INSERT INTO Marriages данные
    const insertRegex = /INSERT INTO `?Marriages`? .*?VALUES\s*\((.*?)\);/gs;
    const marriages: Array<{
      person_1: number;
      person_2: number;
      marriage_date: string | null;
      divorce_date: string | null;
    }> = [];
    
    let match;
    while ((match = insertRegex.exec(dumpSql)) !== null) {
      const values = match[1];
      // Парсим значения вида (1,2,'date',NULL),(3,4,NULL,NULL)...
      const valueMatches = values.matchAll(/\((\d+),(\d+),(?:'([^']*)'|NULL),(?:'([^']*)'|NULL)\)/g);
      for (const valueMatch of valueMatches) {
        marriages.push({
          person_1: parseInt(valueMatch[1]),
          person_2: parseInt(valueMatch[2]),
          marriage_date: valueMatch[3] || null,
          divorce_date: valueMatch[4] || null,
        });
      }
    }

    console.log(`📊 Найдено ${marriages.length} браков\n`);

    // Создаем карту originalId -> id для быстрого поиска
    console.log('🗺️  Создание карты ID...');
    const persons = await prisma.person.findMany({
      where: {
        sourceDb: 'preone',
        originalId: { not: null },
      },
      select: {
        id: true,
        originalId: true,
      },
    });

    const idMap = new Map<string, bigint>();
    for (const person of persons) {
      if (person.originalId) {
        idMap.set(person.originalId.toString(), person.id);
      }
    }

    console.log(`   ✅ Создана карта для ${idMap.size} персон\n`);

    // Создаем браки
    console.log('💑 Создание браков...');
    let created = 0;
    let notFound = 0;
    let errors = 0;

    for (const marriage of marriages) {
      const person1Id = idMap.get(marriage.person_1.toString());
      const person2Id = idMap.get(marriage.person_2.toString());

      if (!person1Id || !person2Id) {
        notFound++;
        continue;
      }

      try {
        // Парсим дату брака
        let marriageYear = null;
        let marriageMonth = null;
        let marriageDay = null;
        let marriageDate = null;

        if (marriage.marriage_date) {
          const parts = marriage.marriage_date.split('/');
          if (parts.length === 3) {
            marriageDay = parseInt(parts[0]);
            marriageMonth = parseInt(parts[1]);
            marriageYear = parseInt(parts[2]);
            try {
              marriageDate = new Date(marriageYear, marriageMonth - 1, marriageDay);
            } catch (e) {
              // Игнорируем неправильные даты
            }
          } else if (parts.length === 1) {
            marriageYear = parseInt(parts[0]);
          }
        }

        // Проверяем, не существует ли уже такой брак
        const existing = await prisma.marriage.findFirst({
          where: {
            OR: [
              { person1Id: person1Id, person2Id: person2Id },
              { person1Id: person2Id, person2Id: person1Id },
            ],
          },
        });

        if (existing) {
          continue; // Пропускаем дубликаты
        }

        await prisma.marriage.create({
          data: {
            person1Id: person1Id,
            person2Id: person2Id,
            marriageDate: marriageDate,
            marriageYear: marriageYear,
            isCurrent: !marriage.divorce_date,
          },
        });

        created++;

        if (created % 100 === 0) {
          console.log(`   Создано ${created} браков...`);
        }
      } catch (error: any) {
        errors++;
        if (errors < 10) {
          console.error(`   ⚠️  Ошибка создания брака:`, error.message);
        }
      }
    }

    console.log(`\n✅ Создание завершено:`);
    console.log(`   - Создано: ${created}`);
    console.log(`   - Не найдено: ${notFound}`);
    console.log(`   - Ошибок: ${errors}`);

    await prisma.$disconnect();

    console.log('\n🎉 Готово!');
  } catch (error) {
    console.error('❌ Ошибка:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

fixMarriages();

