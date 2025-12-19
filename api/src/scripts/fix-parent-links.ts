/**
 * Скрипт для восстановления связей родителей из старых дампов
 * Использует originalId для сопоставления персон
 */

import { prisma } from '../lib/prisma';
import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

async function fixParentLinks() {
  console.log('🔗 Восстановление связей родителей...\n');

  try {
    // Подключаемся к базе
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'albard_new',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'albard_new',
      multipleStatements: true,
    });

    // Парсим дамп d2.sql напрямую для извлечения данных Children
    console.log('📥 Чтение дампа d2.sql...');
    const dumpPath = path.join(process.cwd(), '../d/d2.sql');
    
    if (!fs.existsSync(dumpPath)) {
      console.error('❌ Файл d2.sql не найден!');
      return;
    }

    const dumpSql = fs.readFileSync(dumpPath, 'utf8');
    
    // Извлекаем блок INSERT INTO `Children` VALUES ... ;
    // Используем [\s\S] вместо . для захвата переносов строк
    const childrenBlockRegex = /INSERT INTO `?Children`?\s+VALUES\s+([\s\S]*?);/i;
    const childrenMatch = dumpSql.match(childrenBlockRegex);
    
    const childrenLinks: Array<{ person_id: number; children_id: number }> = [];
    
    if (childrenMatch) {
      const valuesBlock = childrenMatch[1];
      // Парсим все пары (person_id, children_id)
      const valueMatches = valuesBlock.matchAll(/\((\d+),(\d+)\)/g);
      for (const valueMatch of valueMatches) {
        childrenLinks.push({
          person_id: parseInt(valueMatch[1]),
          children_id: parseInt(valueMatch[2]),
        });
      }
    }

    console.log(`📊 Найдено ${childrenLinks.length} связей родитель-ребенок\n`);

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
        gender: true,
      },
    });

    const idMap = new Map<string, { id: bigint; gender: string }>();
    for (const person of persons) {
      if (person.originalId) {
        idMap.set(person.originalId.toString(), {
          id: person.id,
          gender: person.gender,
        });
      }
    }

    console.log(`   ✅ Создана карта для ${idMap.size} персон\n`);

    // Обновляем связи
    console.log('🔄 Обновление связей...');
    let updatedMothers = 0;
    let updatedFathers = 0;
    let notFound = 0;

    for (const link of childrenLinks as any[]) {
      // В таблице Children: person_id = родитель, children_id = ребенок
      const parentOriginalId = link.person_id?.toString();
      const childOriginalId = link.children_id?.toString();

      if (!childOriginalId || !parentOriginalId) continue;

      const child = idMap.get(childOriginalId);
      const parent = idMap.get(parentOriginalId);

      if (!child || !parent) {
        notFound++;
        continue;
      }

      try {
        if (parent.gender === 'female') {
          await prisma.person.update({
            where: { id: child.id },
            data: { motherId: parent.id },
          });
          updatedMothers++;
        } else if (parent.gender === 'male') {
          await prisma.person.update({
            where: { id: child.id },
            data: { fatherId: parent.id },
          });
          updatedFathers++;
        }

        if ((updatedMothers + updatedFathers) % 100 === 0) {
          console.log(`   Обновлено: ${updatedMothers} матерей, ${updatedFathers} отцов...`);
        }
      } catch (error) {
        console.error(`   ⚠️  Ошибка обновления связи:`, error);
      }
    }

    console.log(`\n✅ Обновление завершено:`);
    console.log(`   - Матерей: ${updatedMothers}`);
    console.log(`   - Отцов: ${updatedFathers}`);
    console.log(`   - Не найдено: ${notFound}`);

    await connection.end();
    await prisma.$disconnect();

    console.log('\n🎉 Готово!');
  } catch (error) {
    console.error('❌ Ошибка:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

fixParentLinks();

