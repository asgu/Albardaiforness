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

// Получить медиафайл по ID (редирект на старый домен)
router.get('/:id', (req, res) => mediaController.getById(req, res));

// Получить все медиафайлы персоны
router.get('/person/:personId', (req, res) => mediaController.getByPersonId(req, res));

// Получить аватар персоны
router.get('/avatar/:personId', (req, res) => mediaController.getAvatarUrl(req, res));

// Загрузить медиафайлы (требует авторизации)
router.post('/upload', authMiddleware, upload.array('files', 10), (req, res) => 
  mediaController.upload(req, res)
);

// Удалить медиафайл (требует авторизации)
router.delete('/:id', authMiddleware, (req, res) => mediaController.delete(req, res));

export default router;

