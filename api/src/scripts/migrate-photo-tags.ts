/**
 * Миграция меток персон на фотографиях
 * 
 * Парсит PHP сериализованные данные из колонки `marks` таблицы Photo
 * и создает записи в таблице MediaPerson с координатами меток
 */

import mysql from 'mysql2/promise';
import { prisma } from '../lib/prisma';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config();

interface PhotoMarks {
  [personId: string]: {
    x: string;
    y: string;
    width: string;
    height: string;
    name: string;
  };
}

/**
 * Парсит PHP сериализованный массив из колонки marks
 * Формат: a:17:{i:2391;a:5:{i:0;s:3:"189";i:1;s:3:"412";i:2;s:3:"355";i:3;s:3:"474";i:4;s:12:"tico' nerina";}...}
 */
function parsePhpMarks(marksStr: string): PhotoMarks | null {
  if (!marksStr || marksStr === 'NULL') return null;

  try {
    const marks: PhotoMarks = {};
    
    // Регулярное выражение для поиска каждой персоны в массиве
    // Формат: i:PERSON_ID;a:5:{i:0;s:LEN:"X";i:1;s:LEN:"Y";i:2;s:LEN:"WIDTH";i:3;s:LEN:"HEIGHT";i:4;s:LEN:"NAME";}
    const personRegex = /i:(\d+);a:5:\{i:0;s:\d+:"(\d+)";i:1;s:\d+:"(\d+)";i:2;s:\d+:"(\d+)";i:3;s:\d+:"(\d+)";i:4;s:\d+:"([^"]+)";/g;
    
    let match;
    while ((match = personRegex.exec(marksStr)) !== null) {
      const [, personId, x, y, width, height, name] = match;
      marks[personId] = { x, y, width, height, name };
    }
    
    return Object.keys(marks).length > 0 ? marks : null;
  } catch (error) {
    console.error('Error parsing marks:', error);
    return null;
  }
}

/**
 * Конвертирует абсолютные координаты в проценты
 * Предполагаем стандартный размер фото (можно уточнить из EXIF)
 */
function coordinatesToPercent(x: string, y: string, imageWidth: number = 3000, imageHeight: number = 2000): { x: number; y: number } {
  const xNum = parseInt(x);
  const yNum = parseInt(y);
  
  return {
    x: Math.round((xNum / imageWidth) * 10000) / 100, // 2 знака после запятой
    y: Math.round((yNum / imageHeight) * 10000) / 100,
  };
}

async function migratePhotoTags(
  serverCode: string,
  dumpFileName: string
) {
  console.log(`\n🏷️  Начинаем миграцию меток на фото для ${serverCode}...`);
  console.log(`📁 Дамп: ${dumpFileName}\n`);

  // Получаем сервер из БД
  const server = await prisma.server.findUnique({
    where: { code: serverCode },
  });

  if (!server) {
    throw new Error(`Сервер ${serverCode} не найден в БД`);
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

  // Загружаем дамп
  console.log(`📥 Загрузка дампа ${dumpFileName}...`);
  const dumpPath = path.join(process.cwd(), '../d', dumpFileName);
  const dumpSql = fs.readFileSync(dumpPath, 'utf8');

  // Разбиваем на отдельные команды и выполняем
  await connection.query('SET FOREIGN_KEY_CHECKS=0;');
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
          // Игнорируем ошибки
        }
      }
    }
  }
  await connection.query('SET FOREIGN_KEY_CHECKS=1;');
  console.log('✅ Дамп загружен\n');

  // Создаем маппинг originalId -> personId
  console.log('📊 Создание маппинга персон...');
  const persons = await prisma.person.findMany({
    where: { primaryServerId: server.id },
    select: { id: true, originalId: true },
  });

  const personIdMap = new Map<number, bigint>();
  persons.forEach(p => {
    if (p.originalId) {
      personIdMap.set(Number(p.originalId), p.id);
    }
  });
  console.log(`✅ Найдено ${personIdMap.size} персон\n`);

  // Создаем маппинг filePath -> mediaId
  console.log('📊 Создание маппинга медиафайлов...');
  const mediaFiles = await prisma.media.findMany({
    where: {
      person: {
        primaryServerId: server.id,
      },
      mediaType: 'photo',
    },
    select: {
      id: true,
      filePath: true,
    },
  });

  const mediaIdMap = new Map<string, bigint>();
  mediaFiles.forEach(m => {
    // Извлекаем имя файла из URL
    const fileName = m.filePath.split('/').pop();
    if (fileName) {
      mediaIdMap.set(fileName, m.id);
    }
  });
  console.log(`✅ Найдено ${mediaIdMap.size} медиафайлов\n`);

  // ========================================
  // Импорт меток на фото
  // ========================================
  console.log('🏷️  Импорт меток на фото...');
  const [photoRows] = await connection.query<any[]>(
    'SELECT id, person, filePath, marks FROM Photo WHERE marks IS NOT NULL AND marks != ""'
  );
  console.log(`   Найдено ${photoRows.length} фотографий с метками`);

  let importedTags = 0;
  let skippedPhotos = 0;
  let skippedTags = 0;

  for (const photo of photoRows) {
    const mediaId = mediaIdMap.get(photo.filePath);
    
    if (!mediaId) {
      skippedPhotos++;
      continue;
    }

    // Парсим метки
    const marks = parsePhpMarks(photo.marks);
    
    if (!marks) {
      skippedPhotos++;
      continue;
    }

    // Создаем записи для каждой персоны на фото
    for (const [oldPersonId, coords] of Object.entries(marks)) {
      const personId = personIdMap.get(parseInt(oldPersonId));
      
      if (!personId) {
        skippedTags++;
        continue;
      }

      try {
        // Конвертируем координаты в проценты
        const { x, y } = coordinatesToPercent(coords.x, coords.y);

        // Проверяем, не существует ли уже такая метка
        const existing = await prisma.mediaPerson.findUnique({
          where: {
            mediaId_personId: {
              mediaId,
              personId,
            },
          },
        });

        if (!existing) {
          await prisma.mediaPerson.create({
            data: {
              mediaId,
              personId,
              positionX: x,
              positionY: y,
            },
          });

          importedTags++;
          if (importedTags % 100 === 0) {
            console.log(`   Импортировано ${importedTags} меток...`);
          }
        }
      } catch (error: any) {
        console.error(`   ⚠️  Ошибка импорта метки для персоны ${oldPersonId} на фото ${photo.filePath}:`, error.message);
      }
    }
  }

  console.log(`✅ Импортировано меток: ${importedTags}`);
  console.log(`⏭️  Пропущено фото (нет в БД): ${skippedPhotos}`);
  console.log(`⏭️  Пропущено меток (персона не найдена): ${skippedTags}\n`);

  await connection.end();

  console.log('✅ Миграция меток завершена!\n');
}

async function main() {
  try {
    // Миграция Albaro (ad1.sql)
    await migratePhotoTags('albaro', 'ad1.sql');

    // Миграция Preone (d2.sql)
    await migratePhotoTags('preone', 'd2.sql');

    console.log('🎉 Все метки успешно импортированы!');
  } catch (error) {
    console.error('❌ Ошибка миграции:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

