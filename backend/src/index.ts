import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import orderRoutes from './routes/orders';
import bannerRoutes from './routes/banners';
import customerRoutes from './routes/customers';
import paymentRoutes from './routes/payments';

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;

// ── Security Headers ───────────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: false,     // disabled for now
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// ── CORS ──────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Rate Limiting (disabled for development) ──────────────────────────────
// const generalLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 100,
//   standardHeaders: true,
//   legacyHeaders: false,
//   message: { success: false, message: 'Too many requests, please try again later.' },
// });

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts, please try again in 15 minutes.' },
});

// app.use(generalLimiter);   // ← disabled
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ── Static Files ─────────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`📁 Created upload directory: ${uploadDir}`);
}
app.use('/uploads', express.static(uploadDir));

// ── Diagnostic uploads list ──────────────────────────────────────────────
app.get('/api/uploads/list', (_req, res) => {
  try {
    const files = fs.readdirSync(uploadDir);
    res.json({
      success: true,
      data: {
        uploadDir,
        files: files.map(f => ({
          name: f,
          url: `/uploads/${f}`,
          fullUrl: `http://localhost:${PORT}/uploads/${f}`,
        })),
        count: files.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to list uploads' });
  }
});

// ── Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/payments', paymentRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Fashion World API running' });
});

// ── 404 & Error Handlers ─────────────────────────────────────────────────
app.use((_req, res) => { res.status(404).json({ success: false, message: 'Route not found' }); });
app.use((err: Error & { status?: number }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('❌ Error:', err.message);
  res.status(err.status || 500).json({ success: false, message: 'Internal server error' });
});

// ── Database & Start ─────────────────────────────────────────────────────
const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fashionworld';
    await mongoose.connect(uri);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 Fashion World API running on port ${PORT}`);
  });
});

export default app;