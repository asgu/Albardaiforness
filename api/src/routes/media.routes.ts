import { Router } from 'express';
import { MediaController } from '../controllers/MediaController';
import { authMiddleware } from '../middleware/auth';
import multer from 'multer';
import path from 'path';

const router = Router();
const mediaController = new MediaController();

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/media');
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Public routes
router.get('/', (req, res) => mediaController.getAllMedia(req, res)); // Gallery: get all media
router.get('/search', (req, res) => mediaController.search(req, res));
router.get('/person/:personId', (req, res) => mediaController.getByPersonId(req, res));
router.get('/avatar/:personId', (req, res) => mediaController.getAvatarUrl(req, res));
router.get('/:id', (req, res) => mediaController.getById(req, res)); // Must be last to avoid conflicts

// Admin routes
router.post('/upload', authMiddleware, upload.array('files', 10), (req, res) => 
  mediaController.upload(req, res)
);
router.put('/:id', authMiddleware, (req, res) => mediaController.update(req, res));
router.delete('/:id', authMiddleware, (req, res) => mediaController.delete(req, res));
router.post('/delete-multiple', authMiddleware, (req, res) => mediaController.deleteMultiple(req, res));
router.post('/find-duplicates', authMiddleware, (req, res) => mediaController.findDuplicates(req, res));

export default router;

