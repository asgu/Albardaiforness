/**
 * Миграция галереи из gallery.sql
 * Импорт категорий, тегов и медиафайлов для Albaro
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// URL для медиафайлов
const GALLERY_BASE_URL = 'https://gallery.albardaiforness.org/uploads/thumb/';

interface OldCategory {
  id: number;
  parent_id: number | null;
  title: string;
  is_deleted: boolean;
  server_id: number;
}

interface OldTag {
  id: number;
  title: string;
}

interface OldMedia {
  id: number;
  uploaded_by_id: number | null;
  category_id: number | null;
  title: string | null;
  description: string | null;
  type: number | null;
  created_at: Date;
  file_name: string | null;
  hash: string | null;
  old_path: string | null;
}

interface OldMediaTag {
  media_id: number;
  tag_id: number;
}

// Функция для парсинга SQL дампа
function parseSqlDump(filePath: string): {
  categories: OldCategory[];
  tags: OldTag[];
  media: OldMedia[];
  mediaTags: OldMediaTag[];
} {
  console.log(`📖 Reading SQL dump from ${filePath}...`);
  const content = fs.readFileSync(filePath, 'utf-8');
  
  const categories: OldCategory[] = [];
  const tags: OldTag[] = [];
  const media: OldMedia[] = [];
  const mediaTags: OldMediaTag[] = [];

  // Парсим INSERT INTO category
  const categoryMatches = content.match(/INSERT INTO `category` VALUES\s*([\s\S]*?);/);
  if (categoryMatches) {
    const values = categoryMatches[1];
    const rows = values.match(/\(([^)]+)\)/g);
    if (rows) {
      for (const row of rows) {
        const match = row.match(/\((\d+),(NULL|\d+),'([^']*)',(\d+),(\d+)\)/);
        if (match) {
          categories.push({
            id: parseInt(match[1]),
            parent_id: match[2] === 'NULL' ? null : parseInt(match[2]),
            title: match[3].replace(/\\'/g, "'"),
            is_deleted: match[4] === '1',
            server_id: parseInt(match[5]),
          });
        }
      }
    }
  }

  // Парсим INSERT INTO tag
  const tagMatches = content.match(/INSERT INTO `tag` VALUES\s*([\s\S]*?);/);
  if (tagMatches) {
    const values = tagMatches[1];
    const rows = values.match(/\(([^)]+)\)/g);
    if (rows) {
      for (const row of rows) {
        const match = row.match(/\((\d+),'([^']*)'\)/);
        if (match) {
          tags.push({
            id: parseInt(match[1]),
            title: match[2].replace(/\\'/g, "'"),
          });
        }
      }
    }
  }

  // Парсим INSERT INTO media (более сложный, т.к. много полей)
  const mediaRegex = /INSERT INTO `media` VALUES\s*([\s\S]*?);/g;
  let mediaMatch;
  while ((mediaMatch = mediaRegex.exec(content)) !== null) {
    const values = mediaMatch[1];
    // Разбиваем на строки, учитывая что внутри могут быть запятые в строках
    const lines = values.split(/\),\s*\(/);
    
    for (let line of lines) {
      line = line.replace(/^\(/, '').replace(/\)$/, '');
      const parts = line.split(',');
      
      if (parts.length >= 10) {
        const id = parseInt(parts[0]);
        const uploaded_by_id = parts[1] === 'NULL' ? null : parseInt(parts[1]);
        const category_id = parts[2] === 'NULL' ? null : parseInt(parts[2]);
        
        // Извлекаем title (может быть в кавычках)
        let titleMatch = line.match(/,'([^']*)',/);
        const title = titleMatch ? titleMatch[1].replace(/\\'/g, "'") : null;
        
        // Извлекаем description (обычно NULL)
        const description = null;
        
        // Извлекаем type
        const typeMatch = line.match(/,(\d+),'[\d-]+ [\d:]+'/);
        const type = typeMatch ? parseInt(typeMatch[1]) : 0;
        
        // Извлекаем created_at
        const dateMatch = line.match(/'([\d-]+ [\d:]+)'/);
        const created_at = dateMatch ? new Date(dateMatch[1]) : new Date();
        
        // Извлекаем file_name
        const fileMatch = line.match(/'([\da-f]+\.jpg)'/);
        const file_name = fileMatch ? fileMatch[1] : null;
        
        // Извлекаем hash
        const hashMatch = line.match(/'([\da-f]{16})'/);
        const hash = hashMatch ? hashMatch[1] : null;
        
        if (file_name) {
          media.push({
            id,
            uploaded_by_id,
            category_id,
            title,
            description,
            type,
            created_at,
            file_name,
            hash,
            old_path: null,
          });
        }
      }
    }
  }

  // Парсим INSERT INTO media_tag
  const mediaTagMatches = content.match(/INSERT INTO `media_tag` VALUES\s*([\s\S]*?);/);
  if (mediaTagMatches) {
    const values = mediaTagMatches[1];
    const rows = values.match(/\(([^)]+)\)/g);
    if (rows) {
      for (const row of rows) {
        const match = row.match(/\((\d+),(\d+)\)/);
        if (match) {
          mediaTags.push({
            media_id: parseInt(match[1]),
            tag_id: parseInt(match[2]),
          });
        }
      }
    }
  }

  console.log(`✅ Parsed SQL dump:`);
  console.log(`  - Categories: ${categories.length}`);
  console.log(`  - Tags: ${tags.length}`);
  console.log(`  - Media: ${media.length}`);
  console.log(`  - Media-Tags: ${mediaTags.length}\n`);

  return { categories, tags, media, mediaTags };
}

async function main() {
  console.log('🚀 Starting gallery migration...\n');

  try {
    // Читаем дамп из файла
    const serverCode = process.argv[2] || 'albaro';
    const dumpFileName = serverCode === 'preone' ? 'preone-gallery.sql' : 'forness-gallery.sql';
    const dumpPath = path.join(__dirname, '../../../d/', dumpFileName);
    const { categories: oldCategories, tags: oldTags, media: oldMediaFiles, mediaTags: oldMediaTags } = parseSqlDump(dumpPath);

    // Получаем ID сервера Albaro
    const albaroServer = await prisma.server.findUnique({
      where: { code: 'albaro' },
    });

    if (!albaroServer) {
      throw new Error('Albaro server not found in database');
    }

    console.log(`📍 Using server: ${albaroServer.name} (ID: ${albaroServer.id})\n`);

    // 1. Импорт категорий (только для server_id = 1 и не удаленные)
    console.log('📁 Importing categories...');
    const categoryMap = new Map<number, bigint>();

    for (const oldCat of oldCategories.filter(c => c.server_id === 1 && !c.is_deleted)) {
      try {
        const newCategory = await prisma.category.create({
          data: {
            title: oldCat.title || 'Untitled',
            parentId: oldCat.parent_id ? categoryMap.get(oldCat.parent_id) || null : null,
            serverId: albaroServer.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        categoryMap.set(oldCat.id, newCategory.id);
        console.log(`  ✓ Category ${oldCat.id} → ${newCategory.id}: ${oldCat.title}`);
      } catch (error) {
        console.error(`  ✗ Failed to import category ${oldCat.id}:`, error);
      }
    }

    console.log(`✅ Imported ${categoryMap.size} categories\n`);

    // 2. Импорт тегов
    console.log('🏷️  Importing tags...');
    const tagMap = new Map<number, bigint>();

    for (const oldTag of oldTags) {
      try {
        const newTag = await prisma.tag.create({
          data: {
            title: oldTag.title || 'Untitled',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        tagMap.set(oldTag.id, newTag.id);
        console.log(`  ✓ Tag ${oldTag.id} → ${newTag.id}: ${oldTag.title}`);
      } catch (error) {
        console.error(`  ✗ Failed to import tag ${oldTag.id}:`, error);
      }
    }

    console.log(`✅ Imported ${tagMap.size} tags\n`);

    // 3. Импорт медиафайлов (batch-операции для скорости)
    console.log('📷 Importing media files...');
    const mediaMap = new Map<number, bigint>();
    
    // Подготавливаем данные для batch-импорта
    const mediaToImport = [];
    for (const oldMedia of oldMediaFiles) {
      if (!oldMedia.file_name) {
        continue;
      }

      // Формируем URL к файлу
      const filePath = `${GALLERY_BASE_URL}${oldMedia.file_name}`;

      // Определяем тип медиа
      let mediaType: 'photo' | 'document' | 'video' | 'audio' | 'other' = 'photo';
      const ext = oldMedia.file_name.split('.').pop()?.toLowerCase();
      
      if (ext && ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
        mediaType = 'photo';
      } else if (ext && ['pdf', 'doc', 'docx'].includes(ext)) {
        mediaType = 'document';
      } else if (ext && ['mp4', 'avi', 'mov'].includes(ext)) {
        mediaType = 'video';
      } else if (ext && ['mp3', 'wav', 'ogg'].includes(ext)) {
        mediaType = 'audio';
      } else {
        mediaType = 'other';
      }

      mediaToImport.push({
        oldId: oldMedia.id,
        data: {
          mediaType,
          filePath,
          thumbnailPath: filePath,
          fileName: oldMedia.file_name,
          title: oldMedia.title,
          description: oldMedia.description,
          categoryId: oldMedia.category_id ? categoryMap.get(oldMedia.category_id) || null : null,
          isPublic: true,
          isPrimary: false,
          sortOrder: 0,
          createdAt: oldMedia.created_at || new Date(),
          updatedAt: new Date(),
        },
      });
    }

    // Импортируем батчами по 100 записей
    const BATCH_SIZE = 100;
    let importedCount = 0;

    for (let i = 0; i < mediaToImport.length; i += BATCH_SIZE) {
      const batch = mediaToImport.slice(i, i + BATCH_SIZE);
      
      try {
        // Создаем батч
        const createdMedia = await Promise.all(
          batch.map(item => prisma.media.create({ data: item.data }))
        );

        // Сохраняем маппинг ID
        batch.forEach((item, idx) => {
          mediaMap.set(item.oldId, createdMedia[idx].id);
        });

        importedCount += batch.length;
        console.log(`  📊 Imported ${importedCount}/${mediaToImport.length} media files...`);
      } catch (error) {
        console.error(`  ✗ Failed to import batch starting at ${i}:`, error);
        // Пробуем импортировать по одному
        for (const item of batch) {
          try {
            const newMedia = await prisma.media.create({ data: item.data });
            mediaMap.set(item.oldId, newMedia.id);
            importedCount++;
          } catch (err) {
            console.error(`  ✗ Failed to import media ${item.oldId}`);
          }
        }
      }
    }

    console.log(`✅ Imported ${importedCount} media files\n`);

    // 4. Импорт связей медиа-теги
    console.log('🔗 Importing media-tag relationships...');
    let relationCount = 0;

    for (const oldMT of oldMediaTags) {
      try {
        const newMediaId = mediaMap.get(oldMT.media_id);
        const newTagId = tagMap.get(oldMT.tag_id);

        if (!newMediaId || !newTagId) {
          console.log(`  ⚠️  Skipping media_tag: media ${oldMT.media_id} or tag ${oldMT.tag_id} not found`);
          continue;
        }

        await prisma.mediaTag.create({
          data: {
            mediaId: newMediaId,
            tagId: newTagId,
            createdAt: new Date(),
          },
        });

        relationCount++;
      } catch (error) {
        console.error(`  ✗ Failed to import media_tag:`, error);
      }
    }

    console.log(`✅ Imported ${relationCount} media-tag relationships\n`);

    console.log('✨ Gallery migration completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`  - Categories: ${categoryMap.size}`);
    console.log(`  - Tags: ${tagMap.size}`);
    console.log(`  - Media files: ${importedCount}`);
    console.log(`  - Media-Tag relations: ${relationCount}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

