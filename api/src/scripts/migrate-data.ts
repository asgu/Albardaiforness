/**
 * Скрипт миграции данных из трех старых баз Symfony в новую единую базу
 * 
 * Использование:
 * npx ts-node src/scripts/migrate-data.ts
 */

import { prisma } from '../lib/prisma';
import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

// Конфигурация старых баз данных
const OLD_DATABASES = [
  {
    code: 'albaro',
    name: 'Albaro',
    fullName: 'Albaro di Fornezza',
    host: process.env.OLD_DB_HOST || '185.251.38.72',
    port: parseInt(process.env.OLD_DB_PORT || '3306'),
    user: process.env.OLD_DB_USER || 'albard_new',
    password: process.env.OLD_DB_PASSWORD || 'NH3q5QMHutdNvJDk',
    database: 'albard', // Имя старой базы
    color: '#FF6B6B',
    domain: 'albaro.albardaiforness.org',
  },
  {
    code: 'fornezza',
    name: 'Fornezza',
    fullName: 'Fornezza',
    host: process.env.OLD_DB_HOST || '185.251.38.72',
    port: parseInt(process.env.OLD_DB_PORT || '3306'),
    user: process.env.OLD_DB_USER || 'albard_new',
    password: process.env.OLD_DB_PASSWORD || 'NH3q5QMHutdNvJDk',
    database: 'fornezza', // Имя старой базы
    color: '#4ECDC4',
    domain: 'fornezza.albardaiforness.org',
  },
  {
    code: 'santa-maria',
    name: 'Santa Maria',
    fullName: 'Santa Maria',
    host: process.env.OLD_DB_HOST || '185.251.38.72',
    port: parseInt(process.env.OLD_DB_PORT || '3306'),
    user: process.env.OLD_DB_USER || 'albard_new',
    password: process.env.OLD_DB_PASSWORD || 'NH3q5QMHutdNvJDk',
    database: 'santa_maria', // Имя старой базы
    color: '#95E1D3',
    domain: 'santamaria.albardaiforness.org',
  },
];

interface OldPerson {
  id: number;
  first_name: string;
  last_name: string;
  maiden_name?: string;
  nickname?: string;
  birth_date?: string;
  birth_year?: number;
  death_year?: number;
  gender?: string;
  occupation?: string;
  birth_place?: string;
  death_place?: string;
  burial_place?: string;
  avatar?: string;
  mother_id?: number;
  father_id?: number;
  created_at?: Date;
  updated_at?: Date;
}

interface OldMarriage {
  id: number;
  person1_id: number;
  person2_id: number;
  marriage_date?: string;
  marriage_year?: number;
  marriage_place?: string;
  divorce_date?: string;
  divorce_year?: number;
  is_current?: boolean;
  notes?: string;
}

async function migrateData() {
  console.log('🚀 Начало миграции данных...\n');

  try {
    // 1. Создаем серверы
    console.log('📝 Создание серверов...');
    const servers = await Promise.all(
      OLD_DATABASES.map(async (db) => {
        return prisma.server.upsert({
          where: { code: db.code },
          update: {},
          create: {
            code: db.code,
            name: db.name,
            fullName: db.fullName,
            color: db.color,
            domain: db.domain,
            isActive: true,
          },
        });
      })
    );
    console.log(`✅ Создано ${servers.length} серверов\n`);

    // 2. Миграция данных из каждой базы
    for (const dbConfig of OLD_DATABASES) {
      console.log(`\n📦 Миграция из базы: ${dbConfig.name} (${dbConfig.database})`);
      
      const server = servers.find(s => s.code === dbConfig.code);
      if (!server) {
        console.error(`❌ Сервер ${dbConfig.code} не найден`);
        continue;
      }

      // Подключаемся к старой базе
      const connection = await mysql.createConnection({
        host: dbConfig.host,
        port: dbConfig.port,
        user: dbConfig.user,
        password: dbConfig.password,
        database: dbConfig.database,
      });

      try {
        // Получаем персоны из старой базы
        const [oldPersons] = await connection.query<any[]>(
          'SELECT * FROM person ORDER BY id'
        );

        console.log(`   Найдено ${oldPersons.length} персон`);

        // Мапа старых ID -> новых ID
        const personIdMap = new Map<number, bigint>();

        // Импортируем персоны
        let imported = 0;
        for (const oldPerson of oldPersons as OldPerson[]) {
          try {
            // Парсим дату рождения
            let birthDate = null;
            let birthYear = oldPerson.birth_year || null;
            let birthMonth = null;
            let birthDay = null;

            if (oldPerson.birth_date) {
              const parts = oldPerson.birth_date.split('/');
              if (parts.length === 2) {
                birthDay = parseInt(parts[0]);
                birthMonth = parseInt(parts[1]);
              }
              if (birthYear && birthMonth && birthDay) {
                birthDate = new Date(birthYear, birthMonth - 1, birthDay);
              }
            }

            // Создаем персону
            const newPerson = await prisma.person.create({
              data: {
                firstName: oldPerson.first_name,
                lastName: oldPerson.last_name,
                maidenName: oldPerson.maiden_name || null,
                nickName: oldPerson.nickname || null,
                birthDate: birthDate,
                birthYear: birthYear,
                birthMonth: birthMonth,
                birthDay: birthDay,
                deathYear: oldPerson.death_year || null,
                gender: oldPerson.gender === 'm' ? 'male' : oldPerson.gender === 'f' ? 'female' : 'unknown',
                occupation: oldPerson.occupation || null,
                birthPlace: oldPerson.birth_place || null,
                deathPlace: oldPerson.death_place || null,
                burialPlace: oldPerson.burial_place || null,
                primaryServerId: server.id,
                sourceDb: dbConfig.code,
                originalId: BigInt(oldPerson.id),
                isPublic: true,
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

        console.log(`   ✅ Импортировано ${imported} персон`);

        // Обновляем связи родителей (второй проход)
        console.log('   🔗 Обновление связей родителей...');
        let updatedParents = 0;
        for (const oldPerson of oldPersons as OldPerson[]) {
          const newPersonId = personIdMap.get(oldPerson.id);
          if (!newPersonId) continue;

          const motherId = oldPerson.mother_id ? personIdMap.get(oldPerson.mother_id) : null;
          const fatherId = oldPerson.father_id ? personIdMap.get(oldPerson.father_id) : null;

          if (motherId || fatherId) {
            await prisma.person.update({
              where: { id: newPersonId },
              data: {
                motherId: motherId || null,
                fatherId: fatherId || null,
              },
            });
            updatedParents++;
          }
        }
        console.log(`   ✅ Обновлено ${updatedParents} связей родителей`);

        // Импортируем браки
        console.log('   💍 Импорт браков...');
        const [oldMarriages] = await connection.query<any[]>(
          'SELECT * FROM marriage ORDER BY id'
        );

        let importedMarriages = 0;
        for (const oldMarriage of oldMarriages as OldMarriage[]) {
          const person1Id = personIdMap.get(oldMarriage.person1_id);
          const person2Id = personIdMap.get(oldMarriage.person2_id);

          if (person1Id && person2Id) {
            try {
              await prisma.marriage.create({
                data: {
                  person1Id,
                  person2Id,
                  marriageYear: oldMarriage.marriage_year || null,
                  marriagePlace: oldMarriage.marriage_place || null,
                  divorceYear: oldMarriage.divorce_year || null,
                  isCurrent: oldMarriage.is_current !== false,
                  notes: oldMarriage.notes || null,
                },
              });
              importedMarriages++;
            } catch (error) {
              console.error(`   ⚠️  Ошибка импорта брака ID ${oldMarriage.id}:`, error);
            }
          }
        }
        console.log(`   ✅ Импортировано ${importedMarriages} браков`);

      } finally {
        await connection.end();
      }
    }

    console.log('\n\n🎉 Миграция завершена успешно!');
    console.log('\n📊 Статистика:');
    
    const stats = await Promise.all([
      prisma.server.count(),
      prisma.person.count(),
      prisma.marriage.count(),
    ]);

    console.log(`   Серверов: ${stats[0]}`);
    console.log(`   Персон: ${stats[1]}`);
    console.log(`   Браков: ${stats[2]}`);

  } catch (error) {
    console.error('\n❌ Ошибка миграции:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Запуск миграции
if (require.main === module) {
  migrateData()
    .then(() => {
      console.log('\n✅ Скрипт завершен');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Скрипт завершен с ошибкой:', error);
      process.exit(1);
    });
}

export { migrateData };

