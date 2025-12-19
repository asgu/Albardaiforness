import { Router } from 'express';
import { DuplicateController } from '../controllers/DuplicateController';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const duplicateController = new DuplicateController();

router.get('/duplicates', authMiddleware, (req, res) => duplicateController.getAll(req, res));
router.get('/persons/:id/duplicates', authMiddleware, (req, res) => duplicateController.findForPerson(req, res));
router.post('/duplicates/:id/merge', authMiddleware, (req, res) => duplicateController.merge(req, res));
router.post('/duplicates/:id/reject', authMiddleware, (req, res) => duplicateController.reject(req, res));

export default router;

