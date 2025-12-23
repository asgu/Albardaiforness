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
            createdBy: userId,
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
}

