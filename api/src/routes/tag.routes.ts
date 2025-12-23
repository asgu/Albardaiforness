import { Router } from 'express';
import { TagController } from '../controllers/TagController';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const tagController = new TagController();

// Public routes
router.get('/', (req, res) => tagController.getAll(req, res));
router.get('/:id', (req, res) => tagController.getById(req, res));
router.get('/:id/media', (req, res) => tagController.getMedia(req, res));

// Admin routes
router.post('/', authMiddleware, (req, res) => tagController.create(req, res));

export default router;

