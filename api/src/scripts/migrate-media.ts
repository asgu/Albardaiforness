/**
 * Миграция медиафайлов (Photo и File) из старых баз данных
 * 
 * Импортирует:
 * - Фотографии из таблицы Photo (ad1.sql - Albaro, d2.sql - Preone)
 * - Файлы из таблицы File (ad1.sql - Albaro, d2.sql - Preone)
 * 
 * Связывает медиафайлы с персонами по originalId
 */

import mysql, { RowDataPacket } from 'mysql2/promise';
import { prisma } from '../lib/prisma';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config();

interface PhotoRow extends RowDataPacket {
  id: number;
  person: number | null;
  filePath: string;
  description: string | null;
  prior: number | null;
  marks: string | null;
  is_private: number;
}

interface FileRow extends RowDataPacket {
  id: number;
  person: number | null;
  filePath: string;
  description: string | null;
  fileName: string | null;
  prior: number | null;
}

async function migrateMedia(
  serverCode: string,
  dumpFileName: string,
  oldDomain: string
) {
  console.log(`\n🎬 Начинаем миграцию медиафайлов для ${serverCode}...`);
  console.log(`📁 Дамп: ${dumpFileName}`);
  console.log(`🌐 Старый домен: ${oldDomain}\n`);

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
          console.error(`   ⚠️  Ошибка выполнения команды ${i}:`, error.message.substring(0, 100));
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

  // ========================================
  // Импорт фотографий (Photo)
  // ========================================
  console.log('📷 Импорт фотографий...');
  const [photoRows] = await connection.query<PhotoRow[]>('SELECT * FROM Photo');
  console.log(`   Найдено ${photoRows.length} фотографий в дампе`);

  let importedPhotos = 0;
  let skippedPhotos = 0;

  for (const photo of photoRows) {
    if (!photo.person || !personIdMap.has(photo.person)) {
      skippedPhotos++;
      continue;
    }

    const personId = personIdMap.get(photo.person)!;

    try {
      // Определяем расширение файла
      const ext = path.extname(photo.filePath).toLowerCase();
      let mimeType = 'image/jpeg';
      if (ext === '.png') mimeType = 'image/png';
      else if (ext === '.gif') mimeType = 'image/gif';
      else if (ext === '.webp') mimeType = 'image/webp';

      // Формируем полный URL к файлу на старом домене
      const fullUrl = `${oldDomain}/uploads/photos/${photo.filePath}`;

      await prisma.media.create({
        data: {
          personId,
          mediaType: 'photo',
          filePath: fullUrl,
          fileName: path.basename(photo.filePath),
          description: photo.description || null,
          sortOrder: photo.prior || 0,
          isPublic: photo.is_private === 0,
          mimeType,
        },
      });

      importedPhotos++;
      if (importedPhotos % 100 === 0) {
        console.log(`   Импортировано ${importedPhotos} фотографий...`);
      }
    } catch (error: any) {
      console.error(`   ⚠️  Ошибка импорта фото ${photo.id}:`, error.message);
    }
  }

  console.log(`✅ Импортировано фотографий: ${importedPhotos}`);
  console.log(`⏭️  Пропущено (нет персоны): ${skippedPhotos}\n`);

  // ========================================
  // Импорт файлов (File)
  // ========================================
  console.log('📄 Импорт файлов...');
  const [fileRows] = await connection.query<FileRow[]>('SELECT * FROM File');
  console.log(`   Найдено ${fileRows.length} файлов в дампе`);

  let importedFiles = 0;
  let skippedFiles = 0;

  for (const file of fileRows) {
    if (!file.person || !personIdMap.has(file.person)) {
      skippedFiles++;
      continue;
    }

    const personId = personIdMap.get(file.person)!;

    try {
      // Определяем тип файла по расширению
      const ext = path.extname(file.filePath).toLowerCase();
      let mediaType: 'photo' | 'document' | 'video' | 'audio' | 'other' = 'document';
      let mimeType = 'application/octet-stream';

      if (['.pdf'].includes(ext)) {
        mediaType = 'document';
        mimeType = 'application/pdf';
      } else if (['.doc', '.docx'].includes(ext)) {
        mediaType = 'document';
        mimeType = 'application/msword';
      } else if (['.mp4', '.avi', '.mov'].includes(ext)) {
        mediaType = 'video';
        mimeType = 'video/mp4';
      } else if (['.mp3', '.wav'].includes(ext)) {
        mediaType = 'audio';
        mimeType = 'audio/mpeg';
      }

      // Формируем полный URL к файлу на старом домене
      const fullUrl = `${oldDomain}/uploads/files/${file.filePath}`;

      await prisma.media.create({
        data: {
          personId,
          mediaType,
          filePath: fullUrl,
          fileName: file.fileName || path.basename(file.filePath),
          description: file.description || null,
          sortOrder: file.prior || 0,
          isPublic: true,
          mimeType,
        },
      });

      importedFiles++;
      if (importedFiles % 50 === 0) {
        console.log(`   Импортировано ${importedFiles} файлов...`);
      }
    } catch (error: any) {
      console.error(`   ⚠️  Ошибка импорта файла ${file.id}:`, error.message);
    }
  }

  console.log(`✅ Импортировано файлов: ${importedFiles}`);
  console.log(`⏭️  Пропущено (нет персоны): ${skippedFiles}\n`);

  await connection.end();

  console.log('✅ Миграция медиафайлов завершена!\n');
  console.log('📊 Итого:');
  console.log(`   Фотографий: ${importedPhotos}`);
  console.log(`   Файлов: ${importedFiles}`);
  console.log(`   Всего медиафайлов: ${importedPhotos + importedFiles}\n`);
}

async function main() {
  try {
    // Миграция Albaro (ad1.sql)
    await migrateMedia('albaro', 'ad1.sql', 'https://albardaiforness.org');

    // Миграция Preone (d2.sql)
    await migrateMedia('preone', 'd2.sql', 'https://alberodipreone.org');

    console.log('🎉 Все медиафайлы успешно импортированы!');
  } catch (error) {
    console.error('❌ Ошибка миграции:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

