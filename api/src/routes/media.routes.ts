import { Router } from 'express';
import { MediaController } from '../controllers/MediaController';

const router = Router();
const mediaController = new MediaController();

// Получить медиафайл по ID (редирект на старый домен)
router.get('/:id', (req, res) => mediaController.getById(req, res));

// Получить все медиафайлы персоны
router.get('/person/:personId', (req, res) => mediaController.getByPersonId(req, res));

// Получить аватар персоны
router.get('/avatar/:personId', (req, res) => mediaController.getAvatarUrl(req, res));

export default router;

