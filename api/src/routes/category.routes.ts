import { Router } from 'express';
import { CategoryController } from '../controllers/CategoryController';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const categoryController = new CategoryController();

// Public routes
router.get('/', (req, res) => categoryController.getAll(req, res));
router.get('/:id', (req, res) => categoryController.getById(req, res));
router.get('/:id/media', (req, res) => categoryController.getMedia(req, res));

// Admin routes
router.post('/', authMiddleware, (req, res) => categoryController.create(req, res));
router.put('/:id', authMiddleware, (req, res) => categoryController.update(req, res));
router.delete('/:id', authMiddleware, (req, res) => categoryController.delete(req, res));

export default router;

