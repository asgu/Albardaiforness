/**
 * Установка аватаров для персон
 * 
 * 1. Из поля `avatar` таблицы Person (специальные аватары из /uploads/avatar/)
 * 2. Из первой фотографии персоны (если нет специального аватара)
 */

import mysql from 'mysql2/promise';
import { prisma } from '../lib/prisma';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config();

async function setAvatars(
  serverCode: string,
  dumpFileName: string,
  oldDomain: string
) {
  console.log(`\n👤 Начинаем установку аватаров для ${serverCode}...`);
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

  // ========================================
  // Установка специальных аватаров из поля avatar
  // ========================================
  console.log('👤 Установка специальных аватаров...');
  const [personRows] = await connection.query<any[]>(
    'SELECT id, avatar FROM Person WHERE avatar IS NOT NULL AND avatar != ""'
  );
  console.log(`   Найдено ${personRows.length} персон со специальными аватарами`);

  let setSpecialAvatars = 0;
  let createdAvatarMedia = 0;

  for (const oldPerson of personRows) {
    const personId = personIdMap.get(oldPerson.id);
    
    if (!personId) {
      continue;
    }

    const avatarPath = oldPerson.avatar;
    
    if (!avatarPath || !avatarPath.startsWith('/uploads/avatar/')) {
      continue;
    }

    try {
      // Формируем полный URL к аватару
      const fileName = path.basename(avatarPath);
      const fullUrl = `${oldDomain}${avatarPath}`;

      // Определяем MIME тип
      const ext = path.extname(fileName).toLowerCase();
      let mimeType = 'image/jpeg';
      if (ext === '.png') mimeType = 'image/png';
      else if (ext === '.gif') mimeType = 'image/gif';
      else if (ext === '.webp') mimeType = 'image/webp';

      // Создаем медиафайл для аватара
      const avatarMedia = await prisma.media.create({
        data: {
          personId,
          mediaType: 'photo',
          filePath: fullUrl,
          fileName,
          title: 'Avatar',
          sortOrder: -1, // Аватары идут первыми
          isPublic: true,
          isPrimary: true,
          mimeType,
        },
      });

      // Устанавливаем как аватар персоны
      await prisma.person.update({
        where: { id: personId },
        data: { avatarMediaId: avatarMedia.id },
      });

      setSpecialAvatars++;
      createdAvatarMedia++;
      
      if (setSpecialAvatars % 100 === 0) {
        console.log(`   Установлено ${setSpecialAvatars} специальных аватаров...`);
      }
    } catch (error: any) {
      console.error(`   ⚠️  Ошибка установки аватара для персоны ${oldPerson.id}:`, error.message);
    }
  }

  console.log(`✅ Установлено специальных аватаров: ${setSpecialAvatars}`);
  console.log(`✅ Создано медиафайлов для аватаров: ${createdAvatarMedia}\n`);

  // ========================================
  // Установка аватаров из первой фотографии
  // ========================================
  console.log('📷 Установка аватаров из первых фотографий...');
  
  // Находим персон без аватаров
  const personsWithoutAvatars = await prisma.person.findMany({
    where: {
      primaryServerId: server.id,
      avatarMediaId: null,
    },
    select: { id: true },
  });

  console.log(`   Найдено ${personsWithoutAvatars.length} персон без аватаров`);

  let setPhotoAvatars = 0;

  for (const person of personsWithoutAvatars) {
    try {
      // Находим первую фотографию персоны
      const firstPhoto = await prisma.media.findFirst({
        where: {
          personId: person.id,
          mediaType: 'photo',
          deletedAt: null,
        },
        orderBy: [
          { isPrimary: 'desc' },
          { sortOrder: 'asc' },
          { createdAt: 'asc' },
        ],
        select: { id: true },
      });

      if (firstPhoto) {
        // Устанавливаем первую фотографию как аватар
        await prisma.person.update({
          where: { id: person.id },
          data: { avatarMediaId: firstPhoto.id },
        });

        setPhotoAvatars++;
        
        if (setPhotoAvatars % 100 === 0) {
          console.log(`   Установлено ${setPhotoAvatars} аватаров из фотографий...`);
        }
      }
    } catch (error: any) {
      console.error(`   ⚠️  Ошибка установки аватара из фото:`, error.message);
    }
  }

  console.log(`✅ Установлено аватаров из фотографий: ${setPhotoAvatars}\n`);

  await connection.end();

  console.log('✅ Установка аватаров завершена!\n');
  console.log('📊 Итого:');
  console.log(`   Специальных аватаров: ${setSpecialAvatars}`);
  console.log(`   Аватаров из фотографий: ${setPhotoAvatars}`);
  console.log(`   Всего аватаров: ${setSpecialAvatars + setPhotoAvatars}\n`);
}

async function main() {
  try {
    // Установка аватаров для Albaro
    await setAvatars('albaro', 'ad1.sql', 'https://albardaiforness.org');

    // Установка аватаров для Preone
    await setAvatars('preone', 'd2.sql', 'https://alberodipreone.org');

    console.log('🎉 Все аватары успешно установлены!');
  } catch (error) {
    console.error('❌ Ошибка установки аватаров:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

