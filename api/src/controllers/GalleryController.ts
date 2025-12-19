import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

export class GalleryController {
  async getGallery(req: Request, res: Response) {
    try {
      const galleryPath = path.join(process.cwd(), 'uploads', 'gallery');
      
      if (!fs.existsSync(galleryPath)) {
        return res.json({ files: [], time: Date.now(), json: JSON.stringify([]) });
      }

      const files = fs.readdirSync(galleryPath).filter(file => {
        return file !== '.' && file !== '..';
      });

      res.json({
        files,
        time: Date.now(),
        json: JSON.stringify(files),
      });
    } catch (error) {
      console.error('Get gallery error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

