import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export class MediaController {
  /**
   * Получить медиафайл по ID
   * Возвращает URL к файлу на старом домене
   */
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const media = await prisma.media.findUnique({
        where: { id: BigInt(id) },
        select: {
          id: true,
          filePath: true,
          fileName: true,
          mimeType: true,
          mediaType: true,
          title: true,
          description: true,
        },
      });

      if (!media) {
        return res.status(404).json({ error: 'Media not found' });
      }

      // Если filePath уже содержит полный URL, редиректим на него
      if (media.filePath.startsWith('http://') || media.filePath.startsWith('https://')) {
        return res.redirect(media.filePath);
      }

      // Иначе возвращаем метаданные
      res.json({
        ...media,
        id: media.id.toString(),
      });
    } catch (error) {
      console.error('Get media error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Получить все медиафайлы персоны
   */
  async getByPersonId(req: Request, res: Response) {
    try {
      const { personId } = req.params;

      const media = await prisma.media.findMany({
        where: {
          personId: BigInt(personId),
          deletedAt: null,
        },
        select: {
          id: true,
          mediaType: true,
          filePath: true,
          fileName: true,
          thumbnailPath: true,
          title: true,
          description: true,
          sortOrder: true,
          isPublic: true,
          isPrimary: true,
          dateTaken: true,
          location: true,
          taggedPersons: {
            select: {
              id: true,
              personId: true,
              positionX: true,
              positionY: true,
              person: {
                select: {
                  id: true,
                  originalId: true,
                  firstName: true,
                  lastName: true,
                  nickName: true,
                },
              },
            },
          },
        },
        orderBy: [
          { isPrimary: 'desc' },
          { sortOrder: 'asc' },
          { createdAt: 'asc' },
        ],
      });

      res.json(
        media.map(m => ({
          ...m,
          id: m.id.toString(),
          taggedPersons: m.taggedPersons.map(tp => ({
            ...tp,
            id: tp.id.toString(),
            personId: tp.personId.toString(),
            positionX: tp.positionX ? Number(tp.positionX) : null,
            positionY: tp.positionY ? Number(tp.positionY) : null,
            person: {
              ...tp.person,
              id: tp.person.id.toString(),
              originalId: tp.person.originalId?.toString(),
            },
          })),
        }))
      );
    } catch (error) {
      console.error('Get person media error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Получить URL аватара персоны
   */
  async getAvatarUrl(req: Request, res: Response) {
    try {
      const { personId } = req.params;

      const person = await prisma.person.findUnique({
        where: { id: BigInt(personId) },
        select: {
          avatarMediaId: true,
          avatarMedia: {
            select: {
              filePath: true,
              thumbnailPath: true,
            },
          },
        },
      });

      if (!person || !person.avatarMedia) {
        return res.status(404).json({ error: 'Avatar not found' });
      }

      const avatarUrl = person.avatarMedia.thumbnailPath || person.avatarMedia.filePath;

      // Если URL полный, редиректим
      if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
        return res.redirect(avatarUrl);
      }

      res.json({ url: avatarUrl });
    } catch (error) {
      console.error('Get avatar error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Получить все медиафайлы (для галереи)
   * Поддерживает фильтрацию по категории, тегу, поиску и пагинацию
   */
  async getAllMedia(req: Request, res: Response) {
    try {
      const { categoryId, tagId, search, page = '1', limit = '20' } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {
        deletedAt: null,
        isPublic: true,
      };

      if (categoryId) {
        where.categoryId = BigInt(categoryId as string);
      }

      if (tagId) {
        where.tags = {
          some: {
            tagId: BigInt(tagId as string),
          },
        };
      }

      if (search) {
        where.OR = [
          { title: { contains: search as string, mode: 'insensitive' } },
          { description: { contains: search as string, mode: 'insensitive' } },
          { fileName: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      const [media, total] = await Promise.all([
        prisma.media.findMany({
          where,
          include: {
            category: {
              select: { id: true, title: true },
            },
            tags: {
              include: {
                tag: {
                  select: { id: true, title: true },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: Number(limit),
        }),
        prisma.media.count({ where }),
      ]);

      res.json({
        data: media.map(m => ({
          ...m,
          id: m.id.toString(),
          personId: m.personId?.toString(),
          categoryId: m.categoryId?.toString(),
          category: m.category ? {
            id: m.category.id.toString(),
            title: m.category.title,
          } : undefined,
          tags: m.tags.map((mt: any) => ({
            id: mt.tag.id.toString(),
            title: mt.tag.title,
          })),
        })),
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error('Get all media error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Загрузить медиафайлы
   */
  async upload(req: Request, res: Response) {
    try {
      const files = req.files as Express.Multer.File[];
      const { personId } = req.body;
      const userId = (req as any).user?.id;

      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      if (!personId) {
        return res.status(400).json({ error: 'personId is required' });
      }

      const uploadedMedia = [];

      for (const file of files) {
        // Определить тип медиа по MIME типу
        let mediaType: 'photo' | 'document' | 'video' | 'audio' = 'document';
        if (file.mimetype.startsWith('image/')) {
          mediaType = 'photo';
        } else if (file.mimetype.startsWith('video/')) {
          mediaType = 'video';
        } else if (file.mimetype.startsWith('audio/')) {
          mediaType = 'audio';
        }

        // Создать запись в БД
        const media = await prisma.media.create({
          data: {
            personId: BigInt(personId),
            mediaType,
            filePath: `/uploads/media/${file.filename}`,
            fileName: file.originalname,
            fileSize: file.size,
            mimeType: file.mimetype,
            isPublic: true,
            isPrimary: false,
          },
        });

        uploadedMedia.push({
          ...media,
          id: media.id.toString(),
          personId: media.personId?.toString() || '',
          fileSize: media.fileSize?.toString() || '0',
        });
      }

      res.json({
        message: 'Files uploaded successfully',
        media: uploadedMedia,
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Удалить медиафайл
   */
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      // Мягкое удаление
      await prisma.media.update({
        where: { id: BigInt(id) },
        data: {
          deletedAt: new Date(),
        },
      });

      res.json({ message: 'Media deleted successfully' });
    } catch (error) {
      console.error('Delete media error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Обновить медиафайл
   */
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;
      const { title, description, categoryId, tags } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Обновляем медиа
      const media = await prisma.media.update({
        where: { id: BigInt(id) },
        data: {
          title,
          description,
          categoryId: categoryId ? BigInt(categoryId) : null,
        },
      });

      // Обновляем теги
      if (tags && Array.isArray(tags)) {
        // Удаляем старые теги
        await prisma.mediaTag.deleteMany({
          where: { mediaId: BigInt(id) },
        });

        // Добавляем новые теги
        for (const tag of tags) {
          await prisma.mediaTag.create({
            data: {
              mediaId: BigInt(id),
              tagId: BigInt(tag.id),
            },
          });
        }
      }

      // Получаем обновленное медиа с тегами
      const updatedMedia = await prisma.media.findUnique({
        where: { id: BigInt(id) },
        include: {
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });

      res.json({
        ...updatedMedia,
        id: updatedMedia!.id.toString(),
        personId: updatedMedia!.personId?.toString(),
        categoryId: updatedMedia!.categoryId?.toString(),
        tags: updatedMedia!.tags.map(mt => ({
          id: mt.tag.id.toString(),
          title: mt.tag.title,
        })),
      });
    } catch (error) {
      console.error('Update media error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Массовое удаление медиафайлов
   */
  async deleteMultiple(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { ids } = req.body;

      if (!ids || !Array.isArray(ids)) {
        return res.status(400).json({ error: 'ids array is required' });
      }

      await prisma.media.updateMany({
        where: {
          id: {
            in: ids.map((id: string) => BigInt(id)),
          },
        },
        data: {
          deletedAt: new Date(),
        },
      });

      res.json({ message: 'Media deleted successfully' });
    } catch (error) {
      console.error('Delete multiple media error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Поиск дубликатов медиа по хешу
   */
  async findDuplicates(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { ids } = req.body;

      if (!ids || !Array.isArray(ids)) {
        return res.status(400).json({ error: 'ids array is required' });
      }

      const mediaList = await prisma.media.findMany({
        where: {
          id: {
            in: ids.map((id: string) => BigInt(id)),
          },
          hash: {
            not: null,
          },
        },
        select: {
          id: true,
          hash: true,
        },
      });

      const duplicates = [];

      for (const media of mediaList) {
        if (!media.hash) continue;

        const dups = await prisma.media.findMany({
          where: {
            hash: media.hash,
            id: {
              not: media.id,
            },
            deletedAt: null,
          },
          include: {
            tags: {
              include: {
                tag: true,
              },
            },
          },
        });

        if (dups.length > 0) {
          duplicates.push({
            id: media.id.toString(),
            duplicates: dups.map(d => ({
              ...d,
              id: d.id.toString(),
              personId: d.personId?.toString(),
              categoryId: d.categoryId?.toString(),
              tags: d.tags.map(mt => ({
                id: mt.tag.id.toString(),
                title: mt.tag.title,
              })),
            })),
          });
        }
      }

      res.json(duplicates);
    } catch (error) {
      console.error('Find duplicates error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Поиск медиа
   */
  async search(req: Request, res: Response) {
    try {
      const { query } = req.query;

      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'query parameter is required' });
      }

      const media = await prisma.media.findMany({
        where: {
          deletedAt: null,
          OR: [
            {
              title: {
                contains: query,
              },
            },
            {
              description: {
                contains: query,
              },
            },
            {
              fileName: {
                contains: query,
              },
            },
          ],
        },
        include: {
          tags: {
            include: {
              tag: true,
            },
          },
        },
        take: 50,
      });

      res.json(media.map(m => ({
        ...m,
        id: m.id.toString(),
        personId: m.personId?.toString(),
        categoryId: m.categoryId?.toString(),
        tags: m.tags.map(mt => ({
          id: mt.tag.id.toString(),
          title: mt.tag.title,
        })),
      })));
    } catch (error) {
      console.error('Search media error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

