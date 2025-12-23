import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export class CategoryController {
  /**
   * GET /api/categories
   * Получить все категории для текущего сервера
   */
  async getAll(req: Request, res: Response) {
    try {
      const host = req.get('x-server-host') || req.get('host') || '';
      let serverId: number | undefined;
      
      if (host.includes('albardaiforness')) {
        serverId = 1; // Albaro
      } else if (host.includes('alberodipreone')) {
        serverId = 2; // Preone
      } else if (host.includes('alberodiraveo')) {
        serverId = 3; // Raveo
      }

      if (!serverId) {
        return res.status(400).json({ error: 'Server not determined' });
      }

      const categories = await prisma.category.findMany({
        where: {
          serverId,
          isDeleted: false,
        },
        include: {
          parent: true,
          children: true,
          _count: {
            select: { media: true },
          },
        },
        orderBy: {
          title: 'asc',
        },
      });

      const categoriesWithCount = categories.map(cat => ({
        ...cat,
        id: cat.id.toString(),
        parentId: cat.parentId?.toString(),
        parent: cat.parent ? {
          ...cat.parent,
          id: cat.parent.id.toString(),
          parentId: cat.parent.parentId?.toString(),
        } : null,
        children: cat.children.map(child => ({
          ...child,
          id: child.id.toString(),
          parentId: child.parentId?.toString(),
        })),
        count: cat._count.media,
      }));

      res.json(categoriesWithCount);
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * GET /api/categories/:id
   * Получить категорию по ID с медиа
   */
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const category = await prisma.category.findUnique({
        where: { id: BigInt(id) },
        include: {
          parent: true,
          children: true,
          media: {
            where: { deletedAt: null },
            orderBy: { sortOrder: 'asc' },
          },
        },
      });

      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }

      res.json({
        ...category,
        id: category.id.toString(),
        parentId: category.parentId?.toString(),
        parent: category.parent ? {
          ...category.parent,
          id: category.parent.id.toString(),
          parentId: category.parent.parentId?.toString(),
        } : null,
        children: category.children.map(child => ({
          ...child,
          id: child.id.toString(),
          parentId: child.parentId?.toString(),
        })),
        media: category.media.map(m => ({
          ...m,
          id: m.id.toString(),
          personId: m.personId?.toString(),
          categoryId: m.categoryId?.toString(),
        })),
      });
    } catch (error) {
      console.error('Get category error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * POST /api/categories
   * Создать новую категорию
   */
  async create(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const host = req.get('x-server-host') || req.get('host') || '';
      let serverId: number | undefined;
      
      if (host.includes('albardaiforness')) {
        serverId = 1;
      } else if (host.includes('alberodipreone')) {
        serverId = 2;
      } else if (host.includes('alberodiraveo')) {
        serverId = 3;
      }

      if (!serverId) {
        return res.status(400).json({ error: 'Server not determined' });
      }

      const { title, parentId } = req.body;

      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }

      const category = await prisma.category.create({
        data: {
          title,
          serverId,
          parentId: parentId ? BigInt(parentId) : null,
        },
        include: {
          parent: true,
          children: true,
        },
      });

      res.status(201).json({
        ...category,
        id: category.id.toString(),
        parentId: category.parentId?.toString(),
        parent: category.parent ? {
          ...category.parent,
          id: category.parent.id.toString(),
          parentId: category.parent.parentId?.toString(),
        } : null,
        children: category.children.map(child => ({
          ...child,
          id: child.id.toString(),
          parentId: child.parentId?.toString(),
        })),
      });
    } catch (error) {
      console.error('Create category error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * PUT /api/categories/:id
   * Обновить категорию
   */
  async update(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      const { title, parentId } = req.body;

      const category = await prisma.category.update({
        where: { id: BigInt(id) },
        data: {
          title,
          parentId: parentId ? BigInt(parentId) : null,
        },
        include: {
          parent: true,
          children: true,
        },
      });

      res.json({
        ...category,
        id: category.id.toString(),
        parentId: category.parentId?.toString(),
        parent: category.parent ? {
          ...category.parent,
          id: category.parent.id.toString(),
          parentId: category.parent.parentId?.toString(),
        } : null,
        children: category.children.map(child => ({
          ...child,
          id: child.id.toString(),
          parentId: child.parentId?.toString(),
        })),
      });
    } catch (error) {
      console.error('Update category error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * DELETE /api/categories/:id
   * Удалить категорию (soft delete)
   */
  async delete(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;

      await prisma.category.update({
        where: { id: BigInt(id) },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });

      res.json({ message: 'Category deleted successfully' });
    } catch (error) {
      console.error('Delete category error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * GET /api/categories/:id/media
   * Получить все медиа в категории
   */
  async getMedia(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const media = await prisma.media.findMany({
        where: {
          categoryId: BigInt(id),
          deletedAt: null,
        },
        include: {
          tags: {
            include: {
              tag: true,
            },
          },
        },
        orderBy: {
          sortOrder: 'asc',
        },
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
      console.error('Get category media error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

