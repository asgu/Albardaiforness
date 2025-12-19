import { Router } from 'express';
import { PersonController } from '../controllers/PersonController';

const router = Router();
const personController = new PersonController();

router.get('/today', (req, res) => personController.getBirthdayToday(req, res));
router.get('/search', (req, res) => personController.search(req, res));

export default router;

