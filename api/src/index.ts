import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { prisma } from './lib/prisma';
import authRoutes from './routes/auth.routes';
import apiRoutes from './routes/api.routes';
import personRoutes from './routes/person.routes';
import serverRoutes from './routes/server.routes';
import duplicateRoutes from './routes/duplicate.routes';
import mediaRoutes from './routes/media.routes';
import categoryRoutes from './routes/category.routes';
import tagRoutes from './routes/tag.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3300;

// CORS configuration
const allowedOrigins = [
  'https://new.albardaiforness.org',
  'https://new.alberodipreone.org',
  'https://new.alberodiraveo.org',
  'http://localhost:3301',
  'http://localhost:3000',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(null, false);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/api/health', async (req, res) => {
  try {
    // Проверяем подключение к БД
    await prisma.$queryRaw`SELECT 1`;
    res.json({ 
      status: 'ok', 
      message: 'Albero API is running',
      database: 'connected'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.use('/api', authRoutes);
app.use('/api', apiRoutes);
app.use('/api', serverRoutes);
app.use('/api', duplicateRoutes);
app.use('/api', personRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/tags', tagRoutes);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🗄️  Database: ${process.env.DB_NAME}`);
});

export default app;
