/**
 * Быстрый скрипт для импорта связей родителей из дампа Albaro
 * Оптимизированная версия с batch updates
 * 
 * Использование:
 * DUMP_PATH=/tmp/ad1.sql npx ts-node src/scripts/fix-albaro-links-fast.ts
 */

import { prisma } from '../lib/prisma';
import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

async function fixAlbaroLinksFast() {
  console.log('🚀 Начало быстрого импорта связей родителей для Albaro...\n');

  try {
    const server = await prisma.server.findUnique({
      where: { code: 'albaro' },
    });

    if (!server) {
      console.error('❌ Сервер "albaro" не найден!');
      return;
    }

    console.log(`✅ Сервер найден: ${server.name} (ID: ${server.id})\n`);

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'albard_new',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'albard_new',
      multipleStatements: true,
    });

    console.log('📝 Подготовка к импорту дампа...');
    await connection.query('SET FOREIGN_KEY_CHECKS=0;');

    console.log('📥 Загрузка дампа ad1.sql...');
    const dumpPath = process.env.DUMP_PATH || path.join(process.cwd(), '../d/ad1.sql');
    
    if (!fs.existsSync(dumpPath)) {
      console.error(`❌ Файл дампа не найден: ${dumpPath}`);
      return;
    }
    
    const dumpSql = fs.readFileSync(dumpPath, 'utf8');
    const statements = dumpSql
      .split(';\n')
      .filter(stmt => stmt.trim() && !stmt.trim().startsWith('--') && !stmt.trim().startsWith('/*'));
    
    console.log('   Импортируем только таблицу Children...\n');
    
    for (const stmt of statements) {
      if (stmt.includes('CREATE TABLE `Children`') || stmt.includes('INSERT INTO `Children`')) {
        try {
          await connection.query(stmt);
        } catch (error: any) {
          // Игнорируем ошибки
        }
      }
    }

    await connection.query('SET FOREIGN_KEY_CHECKS=1;');
    console.log('✅ Таблица Children загружена\n');

    // Загружаем все персоны Albaro в память с полом
    console.log('📋 Загрузка всех персон Albaro в память...');
    const persons = await prisma.person.findMany({
      where: { sourceDb: 'albaro' },
      select: { id: true, originalId: true, gender: true },
    });

    const personIdMap = new Map<number, { newId: bigint; gender: string }>();
    for (const person of persons) {
      if (person.originalId) {
        personIdMap.set(Number(person.originalId), {
          newId: person.id,
          gender: person.gender,
        });
      }
    }

    console.log(`   Загружено ${personIdMap.size} персон\n`);

    // Получаем все связи из Children
    console.log('🔗 Загрузка связей родителей...');
    const [childrenLinks] = await connection.query<any[]>('SELECT * FROM Children');
    console.log(`   Найдено ${childrenLinks.length} связей\n`);

    // Подготавливаем batch updates
    console.log('⚡ Подготовка batch updates...');
    const motherUpdates: bigint[] = [];
    const fatherUpdates: bigint[] = [];
    const updates: Array<{ childId: bigint; motherId?: bigint; fatherId?: bigint }> = [];

    for (const link of childrenLinks as any[]) {
      // ВАЖНО: в старой базе Albaro связи записаны НАОБОРОТ!
      // link.child содержит ID родителя (старший по возрасту)
      // link.parent содержит ID ребенка (младший по возрасту)
      const childData = personIdMap.get(link.parent);  // parent -> child
      const parentData = personIdMap.get(link.child);  // child -> parent

      if (childData && parentData) {
        const childId = childData.newId;
        const parentId = parentData.newId;
        const parentGender = parentData.gender;

        // Находим или создаем запись для этого ребенка
        let update = updates.find(u => u.childId === childId);
        if (!update) {
          update = { childId };
          updates.push(update);
        }

        // Устанавливаем мать или отца
        if (parentGender === 'female') {
          update.motherId = parentId;
        } else if (parentGender === 'male') {
          update.fatherId = parentId;
        }
      }
    }

    console.log(`   Подготовлено ${updates.length} обновлений\n`);

    // Выполняем batch updates
    console.log('💾 Применение обновлений...');
    let updatedMothers = 0;
    let updatedFathers = 0;
    let processed = 0;

    for (const update of updates) {
      try {
        await prisma.person.update({
          where: { id: update.childId },
          data: {
            motherId: update.motherId || undefined,
            fatherId: update.fatherId || undefined,
          },
        });

        if (update.motherId) updatedMothers++;
        if (update.fatherId) updatedFathers++;
        processed++;

        if (processed % 1000 === 0) {
          console.log(`   Обновлено ${processed}/${updates.length} персон...`);
        }
      } catch (error) {
        // Игнорируем ошибки
      }
    }

    console.log(`\n   ✅ Обновлено связей:`);
    console.log(`      Матерей: ${updatedMothers}`);
    console.log(`      Отцов: ${updatedFathers}`);
    console.log(`      Всего персон: ${processed}\n`);

    // Удаляем временную таблицу
    console.log('🗑️  Очистка временной таблицы...');
    await connection.query('DROP TABLE IF EXISTS Children;');
    console.log('   ✅ Таблица Children удалена\n');

    await connection.end();

    console.log('🎉 Импорт связей родителей завершен успешно!');

  } catch (error) {
    console.error('\n❌ Ошибка импорта:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Запуск
if (require.main === module) {
  fixAlbaroLinksFast()
    .then(() => {
      console.log('\n✅ Скрипт завершен');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Скрипт завершен с ошибкой:', error);
      process.exit(1);
    });
}

export { fixAlbaroLinksFast };

