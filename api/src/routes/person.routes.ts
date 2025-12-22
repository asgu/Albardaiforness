import { Router } from 'express';
import { PersonController } from '../controllers/PersonController';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const personController = new PersonController();

// Public routes
router.get('/person/:id', (req, res) => personController.getById(req, res));
router.get('/person/:id/json', (req, res) => personController.getById(req, res));

// Admin routes
router.get('/admin/person/load', authMiddleware, (req, res) => personController.getByIds(req, res));
router.get('/admin/person', authMiddleware, (req, res) => personController.getAll(req, res));
router.post('/admin/person', authMiddleware, (req, res) => personController.create(req, res));
router.put('/admin/person/:id', authMiddleware, (req, res) => personController.update(req, res));
router.patch('/person/:id', authMiddleware, (req, res) => personController.update(req, res));
router.post('/person/:id/relative', authMiddleware, (req, res) => personController.addRelative(req, res));
router.delete('/admin/person/:id', authMiddleware, (req, res) => personController.delete(req, res));

export default router;
