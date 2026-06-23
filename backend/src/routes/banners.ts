import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import Banner from '../models/Banner';
import { protect, requireAgent, AuthRequest } from '../middleware/auth';
import { uploadSingle } from '../middleware/upload';

const router = Router();

// ── GET /api/banners ──────────────────────────────────────────────────────
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const banners = await Banner.find({ isActive: true }).sort({ orderIndex: 1 }).lean();
    res.json({ success: true, data: { banners } });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch banners.' });
  }
});

// ── GET /api/banners/all ── Agent only ────────────────────────────────────
router.get('/all', protect, requireAgent, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const banners = await Banner.find().sort({ orderIndex: 1 }).lean();
    res.json({ success: true, data: { banners } });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch banners.' });
  }
});

// ── POST /api/banners ── Agent only ───────────────────────────────────────
router.post(
  '/',
  protect,
  requireAgent,
  uploadSingle,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('ctaText').trim().notEmpty().withMessage('CTA text is required'),
    body('ctaLink').trim().notEmpty().withMessage('CTA link is required'),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(422).json({ success: false, errors: errors.array() });
      return;
    }

    try {
      const file = req.file;
      const imageUrl = file
        ? `/uploads/${file.filename}`
        : req.body.imageUrl || '';

      if (!imageUrl) {
        res.status(400).json({ success: false, message: 'Banner image is required.' });
        return;
      }

      const count = await Banner.countDocuments();
      const banner = await Banner.create({
        title: req.body.title,
        subtitle: req.body.subtitle,
        image: imageUrl,
        ctaText: req.body.ctaText,
        ctaLink: req.body.ctaLink,
        orderIndex: req.body.orderIndex ?? count,
        isActive: req.body.isActive !== 'false',
        backgroundColor: req.body.backgroundColor || '#000000',
        textColor: req.body.textColor || '#ffffff',
      });

      res.status(201).json({ success: true, message: 'Banner created.', data: { banner } });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to create banner.' });
    }
  }
);

// ── PUT /api/banners/:id ── Agent only ────────────────────────────────────
router.put(
  '/:id',
  protect,
  requireAgent,
  uploadSingle,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const banner = await Banner.findById(req.params.id);
      if (!banner) {
        res.status(404).json({ success: false, message: 'Banner not found.' });
        return;
      }

      const file = req.file;
      const updates = {
        ...req.body,
        ...(file && { image: `/uploads/${file.filename}` }),
        ...(req.body.isActive !== undefined && { isActive: req.body.isActive !== 'false' }),
      };

      const updated = await Banner.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true });
      res.json({ success: true, message: 'Banner updated.', data: { banner: updated } });
    } catch {
      res.status(500).json({ success: false, message: 'Failed to update banner.' });
    }
  }
);

// ── DELETE /api/banners/:id ── Agent only ─────────────────────────────────
router.delete('/:id', protect, requireAgent, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) {
      res.status(404).json({ success: false, message: 'Banner not found.' });
      return;
    }
    res.json({ success: true, message: 'Banner deleted.' });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to delete banner.' });
  }
});

// ── PATCH /api/banners/reorder ── Agent only ──────────────────────────────
router.patch('/reorder', protect, requireAgent, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderedIds } = req.body as { orderedIds: string[] };
    if (!Array.isArray(orderedIds)) {
      res.status(400).json({ success: false, message: 'orderedIds array required.' });
      return;
    }

    await Promise.all(
      orderedIds.map((id, index) =>
        Banner.findByIdAndUpdate(id, { orderIndex: index })
      )
    );

    res.json({ success: true, message: 'Banners reordered.' });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to reorder banners.' });
  }
});

export default router;
