import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';

const router = Router();
const authController = new AuthController();

router.post('/auth', (req, res) => authController.authenticate(req, res));

export default router;

