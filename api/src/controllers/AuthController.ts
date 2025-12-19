import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  async authenticate(req: Request, res: Response) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
      }

      const result = await this.authService.authenticate(username, password);

      if (!result) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      res.json(result);
    } catch (error) {
      console.error('Auth error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

