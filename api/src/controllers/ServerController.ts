import { Request, Response } from 'express';
import { ServerService } from '../services/ServerService';

const serverService = new ServerService();

export class ServerController {
  async getAll(req: Request, res: Response) {
    try {
      const servers = await serverService.getAll();
      res.json(servers);
    } catch (error) {
      console.error('Get servers error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getByCode(req: Request, res: Response) {
    try {
      const { code } = req.params;
      const server = await serverService.getByCodeWithStats(code);

      if (!server) {
        return res.status(404).json({ error: 'Server not found' });
      }

      res.json(server);
    } catch (error) {
      console.error('Get server error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getPersons(req: Request, res: Response) {
    try {
      const { code } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 100;

      const result = await serverService.getPersons(code, page, limit);

      res.json({
        ...result,
        persons: result.persons.map(p => ({
          ...p,
          id: p.id.toString(),
        })),
      });
    } catch (error) {
      console.error('Get server persons error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const server = await serverService.create(req.body);
      res.status(201).json(server);
    } catch (error) {
      console.error('Create server error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { code } = req.params;
      const server = await serverService.update(code, req.body);
      res.json(server);
    } catch (error) {
      console.error('Update server error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

