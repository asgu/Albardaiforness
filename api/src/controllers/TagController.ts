import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export class TagController {
  /**
   * GET /api/tags
   * Получить все теги с количеством медиа
   */
  async getAll(req: Request, res: Response) {
    try {
      const tags = await prisma.tag.findMany({
        include: {
          _count: {
            select: { media: true },
          },
        },
        orderBy: {
          title: 'asc',
        },
      });

      res.json(tags.map(tag => ({
        ...tag,
        id: tag.id.toString(),
        count: tag._count.media,
      })));
    } catch (error) {
      console.error('Get tags error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * GET /api/tags/:id
   * Получить тег по ID
   */
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const tag = await prisma.tag.findUnique({
        where: { id: BigInt(id) },
        include: {
          _count: {
            select: { media: true },
          },
        },
      });

      if (!tag) {
        return res.status(404).json({ error: 'Tag not found' });
      }

      res.json({
        ...tag,
        id: tag.id.toString(),
        count: tag._count.media,
      });
    } catch (error) {
      console.error('Get tag error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * POST /api/tags
   * Создать новый тег
   */
  async create(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { title } = req.body;

      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }

      // Проверяем, существует ли уже такой тег
      const existingTag = await prisma.tag.findUnique({
        where: { title },
      });

      if (existingTag) {
        return res.json({
          ...existingTag,
          id: existingTag.id.toString(),
        });
      }

      const tag = await prisma.tag.create({
        data: { title },
      });

      res.status(201).json({
        ...tag,
        id: tag.id.toString(),
      });
    } catch (error) {
      console.error('Create tag error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * GET /api/tags/:id/media
   * Получить все медиа с данным тегом
   */
  async getMedia(req: Request, res: Response) {
    try {
      const { id } = req.params;

    const mediaWithTag = await prisma.mediaTag.findMany({
      where: {
        tagId: BigInt(id),
      },
      include: {
        media: {
          include: {
            tags: {
              include: {
                tag: true,
              },
            },
          },
        },
      },
    });

    const media = mediaWithTag
      .filter(mt => mt.media && mt.media.deletedAt === null)
      .map(mt => ({
        ...mt.media!,
        id: mt.media!.id.toString(),
        personId: mt.media!.personId?.toString(),
        categoryId: mt.media!.categoryId?.toString(),
        tags: mt.media!.tags.map((t: any) => ({
          id: t.tag.id.toString(),
          title: t.tag.title,
        })),
      }));

      res.json(media);
    } catch (error) {
      console.error('Get tag media error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

