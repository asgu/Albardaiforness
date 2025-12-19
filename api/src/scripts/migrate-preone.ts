/**
 * Скрипт миграции данных из базы alberodipreone.org (Preone)
 * 
 * Использование:
 * npx ts-node src/scripts/migrate-preone.ts
 */

import { prisma } from '../lib/prisma';
import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

interface OldPerson {
  id: number;
  firstName: string;
  lastName: string;
  birth: Date | null;
  birthYear: string;
  birthDate: string;
  death: Date | null;
  deathYear: string;
  deathDate: string;
  occupation: string | null;
  birthPlace: string | null;
  deathPlace: string | null;
  note: string | null;
  privateNote: string | null;
  is_private: boolean;
  avatar: string | null;
  sex: number | null;
  nickname: string | null;
  status: number;
  mirror: number;
}

interface OldMarriage {
  person_1: number;
  person_2: number;
  marriage_date: string | null;
  divorce_date: string | null;
}

async function migratePreoneData() {
  console.log('🚀 Начало миграции данных из Preone...\n');

  try {
    // Проверяем, что сервер Preone существует
    const server = await prisma.server.findUnique({
      where: { code: 'preone' },
    });

    if (!server) {
      console.error('❌ Сервер "preone" не найден в таблице servers!');
      console.log('Пожалуйста, создайте сервер:');
      console.log(`
        INSERT INTO servers (code, name, fullName, color, domain, isActive)
        VALUES ('preone', 'Preone', 'Albero di Preone', '#FFB6C1', 'new.alberodipreone.org', true);
      `);
      return;
    }

    console.log(`✅ Сервер найден: ${server.name} (ID: ${server.id})\n`);

    // Подключаемся к основной базе (нет прав на создание новой БД)
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'albard_new',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'albard_new',
      multipleStatements: true,
    });

    console.log('📝 Подготовка к импорту дампа...');

    // Загружаем дамп
    console.log('📥 Загрузка дампа d2.sql...');
    const dumpPath = path.join(process.cwd(), '../d/d2.sql');
    const dumpSql = fs.readFileSync(dumpPath, 'utf8');
    
    // Разбиваем на отдельные команды и выполняем
    const statements = dumpSql
      .split(';\n')
      .filter(stmt => stmt.trim() && !stmt.trim().startsWith('--') && !stmt.trim().startsWith('/*'));
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim();
      if (stmt) {
        try {
          await connection.query(stmt);
          if (i % 100 === 0) {
            console.log(`   Выполнено ${i}/${statements.length} команд...`);
          }
        } catch (error: any) {
          if (!error.message.includes('already exists')) {
            console.error(`   ⚠️  Ошибка выполнения команды ${i}:`, error.message.substring(0, 100));
          }
        }
      }
    }

    console.log('✅ Дамп загружен\n');

    // Получаем персоны
    console.log('👥 Импорт персон...');
    const [oldPersons] = await connection.query<any[]>(
      'SELECT * FROM Person WHERE status = 1 ORDER BY id'
    );

    console.log(`   Найдено ${oldPersons.length} персон`);

    const personIdMap = new Map<number, bigint>();
    let imported = 0;

    for (const oldPerson of oldPersons as OldPerson[]) {
      try {
        // Парсим даты
        let birthDate = null;
        let birthYear = oldPerson.birthYear ? parseInt(oldPerson.birthYear) : null;
        let birthMonth = null;
        let birthDay = null;

        if (oldPerson.birthDate) {
          const parts = oldPerson.birthDate.split('/');
          if (parts.length === 2) {
            birthDay = parseInt(parts[0]);
            birthMonth = parseInt(parts[1]);
          }
          if (birthYear && birthMonth && birthDay) {
            try {
              birthDate = new Date(birthYear, birthMonth - 1, birthDay);
            } catch (e) {
              // Игнорируем неправильные даты
            }
          }
        }

        let deathYear = oldPerson.deathYear ? parseInt(oldPerson.deathYear) : null;
        let deathMonth = null;
        let deathDay = null;

        if (oldPerson.deathDate) {
          const parts = oldPerson.deathDate.split('/');
          if (parts.length === 2) {
            deathDay = parseInt(parts[0]);
            deathMonth = parseInt(parts[1]);
          }
        }

        // Определяем пол
        let gender: 'male' | 'female' | 'unknown' = 'unknown';
        if (oldPerson.sex === 1) gender = 'male';
        else if (oldPerson.sex === 0) gender = 'female';

        // Создаем персону
        const newPerson = await prisma.person.create({
          data: {
            firstName: oldPerson.firstName,
            lastName: oldPerson.lastName,
            nickName: oldPerson.nickname || null,
            birthDate: birthDate,
            birthYear: birthYear,
            birthMonth: birthMonth,
            birthDay: birthDay,
            deathYear: deathYear,
            deathMonth: deathMonth,
            deathDay: deathDay,
            gender: gender,
            occupation: oldPerson.occupation || null,
            birthPlace: oldPerson.birthPlace || null,
            deathPlace: oldPerson.deathPlace || null,
            note: oldPerson.note || null,
            privateNote: oldPerson.privateNote || null,
            primaryServerId: server.id,
            sourceDb: 'preone',
            originalId: BigInt(oldPerson.id),
            isPublic: !oldPerson.is_private,
            isMerged: false,
          },
        });

        personIdMap.set(oldPerson.id, newPerson.id);
        imported++;

        if (imported % 100 === 0) {
          console.log(`   Импортировано ${imported}/${oldPersons.length} персон...`);
        }
      } catch (error) {
        console.error(`   ⚠️  Ошибка импорта персоны ID ${oldPerson.id}:`, error);
      }
    }

    console.log(`   ✅ Импортировано ${imported} персон\n`);

    // Получаем связи родителей из таблицы Children
    console.log('🔗 Обновление связей родителей...');
    
    // Проверяем существование таблицы
    const [tables] = await connection.query<any[]>(
      "SHOW TABLES LIKE 'Children'"
    );
    
    if (tables.length === 0) {
      console.log('   ⚠️  Таблица Children не найдена, пропускаем обновление родителей');
      console.log('   ℹ️  Связи родителей можно будет установить позже вручную\n');
    } else {
      const [childrenLinks] = await connection.query<any[]>(
        'SELECT * FROM Children'
      );

      let updatedParents = 0;
      for (const link of childrenLinks as any[]) {
        const childId = personIdMap.get(link.person_id);
        const parentId = personIdMap.get(link.children_id);

        if (childId && parentId) {
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
            } else if (parent.gender === 'male') {
              await prisma.person.update({
                where: { id: childId },
                data: { fatherId: parentId },
              });
            }
            updatedParents++;
          }
        }
      }
      console.log(`   ✅ Обновлено ${updatedParents} связей родителей\n`);
    }

    // Импортируем браки
    console.log('💍 Импорт браков...');
    
    // Проверяем существование таблицы
    const [marriageTables] = await connection.query<any[]>(
      "SHOW TABLES LIKE 'Marriages'"
    );
    
    if (marriageTables.length === 0) {
      console.log('   ⚠️  Таблица Marriages не найдена, пропускаем импорт браков\n');
    } else {
      const [oldMarriages] = await connection.query<any[]>(
        'SELECT * FROM Marriages'
      );

      let importedMarriages = 0;
      for (const oldMarriage of oldMarriages as OldMarriage[]) {
        const person1Id = personIdMap.get(oldMarriage.person_1);
        const person2Id = personIdMap.get(oldMarriage.person_2);

        if (person1Id && person2Id) {
          try {
            // Парсим дату брака
            let marriageYear = null;
            let marriageMonth = null;
            let marriageDay = null;

            if (oldMarriage.marriage_date) {
              const parts = oldMarriage.marriage_date.split('/');
              if (parts.length === 3) {
                marriageDay = parseInt(parts[0]);
                marriageMonth = parseInt(parts[1]);
                marriageYear = parseInt(parts[2]);
              }
            }

            await prisma.marriage.create({
              data: {
                person1Id,
                person2Id,
                marriageYear: marriageYear,
                isCurrent: !oldMarriage.divorce_date,
              },
            });
            importedMarriages++;
          } catch (error) {
            // Игнорируем дубликаты браков
          }
        }
      }
      console.log(`   ✅ Импортировано ${importedMarriages} браков\n`);
    }

    // Удаляем временные таблицы из старого дампа
    console.log('🗑️  Очистка временных таблиц...');
    await connection.query(`
      SET FOREIGN_KEY_CHECKS=0;
      DROP TABLE IF EXISTS Person, Photo, Invitation, Message, Point, Video, Visitors, fos_user, 
                           Brotherhood, Changes, Children, FieldChange, File, Log, Marriages;
      SET FOREIGN_KEY_CHECKS=1;
    `);
    console.log('   ✅ Временные таблицы удалены\n');

    // Закрываем соединение
    await connection.end();

    console.log('\n🎉 Миграция Preone завершена успешно!');
    console.log('\n📊 Статистика:');
    
    const stats = await prisma.person.count({
      where: { sourceDb: 'preone' },
    });

    console.log(`   Персон из Preone: ${stats}`);

  } catch (error) {
    console.error('\n❌ Ошибка миграции:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Запуск миграции
if (require.main === module) {
  migratePreoneData()
    .then(() => {
      console.log('\n✅ Скрипт завершен');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Скрипт завершен с ошибкой:', error);
      process.exit(1);
    });
}

export { migratePreoneData };

