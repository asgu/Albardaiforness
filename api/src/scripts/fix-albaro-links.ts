/**
 * Скрипт для импорта связей родителей из дампа Albaro
 * Запускается после основной миграции персон
 * 
 * Использование:
 * DUMP_PATH=/tmp/ad1.sql npx ts-node src/scripts/fix-albaro-links.ts
 */

import { prisma } from '../lib/prisma';
import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

async function fixAlbaroLinks() {
  console.log('🚀 Начало импорта связей родителей для Albaro...\n');

  try {
    // Проверяем, что сервер Albaro существует
    const server = await prisma.server.findUnique({
      where: { code: 'albaro' },
    });

    if (!server) {
      console.error('❌ Сервер "albaro" не найден!');
      return;
    }

    console.log(`✅ Сервер найден: ${server.name} (ID: ${server.id})\n`);

    // Подключаемся к основной базе
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'albard_new',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'albard_new',
      multipleStatements: true,
    });

    console.log('📝 Подготовка к импорту дампа...');

    // Отключаем проверки foreign keys
    await connection.query('SET FOREIGN_KEY_CHECKS=0;');

    // Загружаем дамп
    console.log('📥 Загрузка дампа ad1.sql...');
    const dumpPath = process.env.DUMP_PATH || path.join(process.cwd(), '../d/ad1.sql');
    
    if (!fs.existsSync(dumpPath)) {
      console.error(`❌ Файл дампа не найден: ${dumpPath}`);
      return;
    }
    
    const dumpSql = fs.readFileSync(dumpPath, 'utf8');
    
    // Разбиваем на отдельные команды и выполняем
    const statements = dumpSql
      .split(';\n')
      .filter(stmt => stmt.trim() && !stmt.trim().startsWith('--') && !stmt.trim().startsWith('/*'));
    
    console.log(`   Найдено ${statements.length} SQL команд...`);
    console.log('   Импортируем только таблицу Children...\n');
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim();
      if (stmt && (stmt.includes('CREATE TABLE `Children`') || stmt.includes('INSERT INTO `Children`'))) {
        try {
          await connection.query(stmt);
        } catch (error: any) {
          // Игнорируем ошибки
        }
      }
    }

    // Включаем обратно проверки foreign keys
    await connection.query('SET FOREIGN_KEY_CHECKS=1;');

    console.log('✅ Таблица Children загружена\n');

    // Получаем маппинг старых ID на новые
    console.log('📋 Загрузка маппинга ID персон...');
    const persons = await prisma.person.findMany({
      where: { sourceDb: 'albaro' },
      select: { id: true, originalId: true },
    });

    const personIdMap = new Map<number, bigint>();
    for (const person of persons) {
      if (person.originalId) {
        personIdMap.set(Number(person.originalId), person.id);
      }
    }

    console.log(`   Загружено ${personIdMap.size} персон\n`);

    // Получаем связи родителей из таблицы Children
    console.log('🔗 Обновление связей родителей...');
    
    const [childrenLinks] = await connection.query<any[]>(
      'SELECT * FROM Children'
    );

    console.log(`   Найдено ${childrenLinks.length} связей\n`);

    let updatedMothers = 0;
    let updatedFathers = 0;
    let errors = 0;

    for (const link of childrenLinks as any[]) {
      // ВАЖНО: в старой базе Albaro связи записаны НАОБОРОТ!
      // link.child содержит ID родителя (старший по возрасту)
      // link.parent содержит ID ребенка (младший по возрасту)
      // Поэтому меняем их местами при импорте
      const childId = personIdMap.get(link.parent);  // parent -> child
      const parentId = personIdMap.get(link.child);  // child -> parent

      if (childId && parentId) {
        try {
          // Определяем, мать это или отец
          const parent = await prisma.person.findUnique({
            where: { id: parentId },
            select: { gender: true },
          });

          if (parent) {
            if (parent.gender === 'female') {
              await prisma.person.update({
                where: { id: childId },
                data: { motherId: parentId },
              });
              updatedMothers++;
            } else if (parent.gender === 'male') {
              await prisma.person.update({
                where: { id: childId },
                data: { fatherId: parentId },
              });
              updatedFathers++;
            }
          }

          if ((updatedMothers + updatedFathers) % 100 === 0) {
            console.log(`   Обновлено ${updatedMothers + updatedFathers} связей...`);
          }
        } catch (error) {
          errors++;
        }
      }
    }

    console.log(`\n   ✅ Обновлено связей:`);
    console.log(`      Матерей: ${updatedMothers}`);
    console.log(`      Отцов: ${updatedFathers}`);
    console.log(`      Ошибок: ${errors}\n`);

    // Удаляем временную таблицу
    console.log('🗑️  Очистка временной таблицы...');
    await connection.query('DROP TABLE IF EXISTS Children;');
    console.log('   ✅ Таблица Children удалена\n');

    // Закрываем соединение
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
  fixAlbaroLinks()
    .then(() => {
      console.log('\n✅ Скрипт завершен');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Скрипт завершен с ошибкой:', error);
      process.exit(1);
    });
}

export { fixAlbaroLinks };

