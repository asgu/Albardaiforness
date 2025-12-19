import { Router } from 'express';
import { ServerController } from '../controllers/ServerController';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const serverController = new ServerController();

router.get('/servers', (req, res) => serverController.getAll(req, res));
router.get('/servers/:code', (req, res) => serverController.getByCode(req, res));
router.get('/servers/:code/persons', (req, res) => serverController.getPersons(req, res));
router.post('/servers', authMiddleware, (req, res) => serverController.create(req, res));
router.put('/servers/:code', authMiddleware, (req, res) => serverController.update(req, res));

export default router;

