import { Router } from 'express';
import { GalleryController } from '../controllers/GalleryController';

const router = Router();
const galleryController = new GalleryController();

router.get('/gallery', (req, res) => galleryController.getGallery(req, res));

export default router;

