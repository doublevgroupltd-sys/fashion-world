import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import Banner from '../models/Banner';
import { protect, requireAgent, AuthRequest } from '../middleware/auth';
import { uploadMultiple, processImages } from '../middleware/upload';

const router = Router();

const handleValidation = (req: Request, res: Response): boolean => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({
      success: false,
      errors: errors.array().map((e) => ({ field: (e as any).path, message: e.msg })),
    });
    return false;
  }
  return true;
};

// GET active banners
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const banners = await Banner.find({ isActive: true }).sort({ orderIndex: 1 }).lean();
    res.json({ success: true, data: banners });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch banners.' });
  }
});

// GET all banners (agent only)
router.get('/all', protect, requireAgent, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const banners = await Banner.find().sort({ orderIndex: 1 }).lean();
    res.json({ success: true, data: banners });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch banners.' });
  }
});

// CREATE banner
router.post(
  '/',
  protect,
  requireAgent,
  uploadMultiple,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('ctaText').trim().notEmpty().withMessage('CTA text is required'),
    body('ctaLink').trim().notEmpty().withMessage('CTA link is required'),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!handleValidation(req, res)) return;
    try {
      const files = req.files as Express.Multer.File[];
      const imageUrls = await processImages(files);
      const imageUrl = imageUrls.length > 0 ? imageUrls[0] : '';

      const bannerData = {
        ...req.body,
        image: imageUrl,
        orderIndex: parseInt(req.body.orderIndex) || 0,
        isActive: req.body.isActive === 'true' || req.body.isActive === true,
      };

      const banner = await Banner.create(bannerData);
      res.status(201).json({ success: true, message: 'Banner created.', data: banner });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to create banner.' });
    }
  }
);

// UPDATE banner
router.put(
  '/:id',
  protect,
  requireAgent,
  uploadMultiple,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const banner = await Banner.findById(req.params.id);
      if (!banner) {
        res.status(404).json({ success: false, message: 'Banner not found.' });
        return;
      }

      const files = req.files as Express.Multer.File[];
      const newImageUrls = await processImages(files);
      const newImage = newImageUrls.length > 0 ? newImageUrls[0] : undefined;

      const updates: any = { ...req.body };
      if (req.body.orderIndex) updates.orderIndex = parseInt(req.body.orderIndex);
      if (req.body.isActive !== undefined) updates.isActive = req.body.isActive === 'true' || req.body.isActive === true;
      if (newImage) updates.image = newImage;

      const updated = await Banner.findByIdAndUpdate(
        req.params.id,
        { $set: updates },
        { new: true, runValidators: true }
      );
      res.json({ success: true, message: 'Banner updated.', data: updated });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to update banner.' });
    }
  }
);

// DELETE banner (soft delete)
router.delete('/:id', protect, requireAgent, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const banner = await Banner.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!banner) {
      res.status(404).json({ success: false, message: 'Banner not found.' });
      return;
    }
    res.json({ success: true, message: 'Banner deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete banner.' });
  }
});

// REORDER banners
router.patch('/reorder', protect, requireAgent, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderedIds } = req.body;
    if (!orderedIds?.length) {
      res.status(400).json({ success: false, message: 'orderedIds array required.' });
      return;
    }
    const operations = orderedIds.map((id: string, index: number) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { orderIndex: index } },
      },
    }));
    await Banner.bulkWrite(operations);
    res.json({ success: true, message: 'Banners reordered.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to reorder banners.' });
  }
});

export default router;