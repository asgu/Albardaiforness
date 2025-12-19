import { Request, Response } from 'express';
import { DuplicateService } from '../services/DuplicateService';
import { MergeStrategy } from '@prisma/client';

export class DuplicateController {
  private duplicateService: DuplicateService;

  constructor() {
    this.duplicateService = new DuplicateService();
  }

  async getAll(req: Request, res: Response) {
    try {
      const duplicates = await this.duplicateService.getPendingDuplicates();

      res.json(duplicates.map(d => ({
        ...d,
        id: d.id.toString(),
        person1Id: d.person1Id.toString(),
        person2Id: d.person2Id.toString(),
        person1: (d as any).person1 ? {
          ...(d as any).person1,
          id: (d as any).person1.id.toString(),
        } : undefined,
        person2: (d as any).person2 ? {
          ...(d as any).person2,
          id: (d as any).person2.id.toString(),
        } : undefined,
      })));
    } catch (error) {
      console.error('Get duplicates error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async findForPerson(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const threshold = parseInt(req.query.threshold as string) || 70;

      const duplicates = await this.duplicateService.findDuplicates(
        BigInt(id),
        threshold
      );

      res.json(duplicates.map(d => ({
        ...d,
        id: d.id.toString(),
        person1Id: d.person1Id.toString(),
        person2Id: d.person2Id.toString(),
      })));
    } catch (error) {
      console.error('Find duplicates error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async merge(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { strategy } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!strategy || !Object.values(MergeStrategy).includes(strategy)) {
        return res.status(400).json({ error: 'Invalid merge strategy' });
      }

      const result = await this.duplicateService.mergePersons(
        BigInt(id),
        strategy as MergeStrategy,
        userId
      );

      res.json({
        ...result,
        id: result.id.toString(),
      });
    } catch (error) {
      console.error('Merge persons error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async reject(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const duplicate = await this.duplicateService.rejectDuplicate(
        BigInt(id),
        userId
      );

      res.json({
        ...duplicate,
        id: duplicate.id.toString(),
        person1Id: duplicate.person1Id.toString(),
        person2Id: duplicate.person2Id.toString(),
      });
    } catch (error) {
      console.error('Reject duplicate error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
