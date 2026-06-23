import { Router, Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import Product from '../models/Product';
import { protect, requireAgent, AuthRequest } from '../middleware/auth';
import { uploadMultiple } from '../middleware/upload';

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

// ── GET /api/products ─────────────────────────────────────────────────────
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, parseInt(req.query.limit as string) || 12);
      const skip = (page - 1) * limit;

      const filter: Record<string, unknown> = { isActive: true };

      if (req.query.category) filter.category = req.query.category;
      if (req.query.madeInAfrica === 'true') filter.madeInAfrica = true;
      if (req.query.featured === 'true') filter.featured = true;
      if (req.query.brand) filter.brand = req.query.brand;

      if (req.query.minPrice || req.query.maxPrice) {
        filter.price = {};
        if (req.query.minPrice) (filter.price as any).$gte = parseFloat(req.query.minPrice as string);
        if (req.query.maxPrice) (filter.price as any).$lte = parseFloat(req.query.maxPrice as string);
      }

      if (req.query.search) {
        filter.$text = { $search: req.query.search as string };
      }

      let sort: Record<string, 1 | -1> = { createdAt: -1 };
      switch (req.query.sort) {
        case 'price_asc': sort = { price: 1 }; break;
        case 'price_desc': sort = { price: -1 }; break;
        case 'rating': sort = { rating: -1 }; break;
        case 'popular': sort = { soldCount: -1 }; break;
        case 'newest': sort = { createdAt: -1 }; break;
      }

      const [products, total] = await Promise.all([
        Product.find(filter).sort(sort).skip(skip).limit(limit).lean(),
        Product.countDocuments(filter),
      ]);

      res.json({
        success: true,
        data: {
          products,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
            hasMore: page * limit < total,
          },
        },
      });
    } catch (error) {
      console.error('Get products error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch products.' });
    }
  }
);

// ── GET /api/products/search ──────────────────────────────────────────────
router.get('/search', async (req: Request, res: Response): Promise<void> => {
  try {
    const q = (req.query.q as string)?.trim();
    if (!q || q.length < 2) {
      res.json({ success: true, data: { products: [] } });
      return;
    }

    const products = await Product.find(
      { $text: { $search: q }, isActive: true },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(10)
      .select('name images price category slug')
      .lean();

    res.json({ success: true, data: { products } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Search failed.' });
  }
});

// ── GET /api/products/categories ─────────────────────────────────────────
router.get('/categories', async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await Product.distinct('category', { isActive: true });
    res.json({ success: true, data: { categories } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch categories.' });
  }
});

// ── GET /api/products/:id ─────────────────────────────────────────────────
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findOne({
      $or: [
        { _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null },
        { slug: req.params.id },
      ],
      isActive: true,
    });

    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found.' });
      return;
    }

    const related = await Product.find({
      category: product.category,
      _id: { $ne: product._id },
      isActive: true,
    })
      .limit(4)
      .select('name images price compareAtPrice slug rating')
      .lean();

    res.json({ success: true, data: { product, related } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch product.' });
  }
});

// ── POST /api/products ── Agent only ──────────────────────────────────────
router.post(
  '/',
  protect,
  requireAgent,
  uploadMultiple,
  [
    body('name').trim().notEmpty().withMessage('Product name is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('price').isFloat({ min: 0 }).withMessage('Valid price required'),
    body('category').notEmpty().withMessage('Category is required'),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!handleValidation(req, res)) return;

    try {
      const files = req.files as Express.Multer.File[];
      // 1. Get uploaded file URLs
      const uploadedImages = files?.map(f => `/uploads/${f.filename}`) || [];

      // 2. If the frontend also sends an 'images' JSON string (legacy fallback), parse it
      let otherImages: string[] = [];
      if (req.body.images) {
        try {
          otherImages = JSON.parse(req.body.images);
        } catch {
          otherImages = [];
        }
      }

      const productData = {
        ...req.body,
        price: parseFloat(req.body.price),
        compareAtPrice: req.body.compareAtPrice ? parseFloat(req.body.compareAtPrice) : undefined,
        costPrice: req.body.costPrice ? parseFloat(req.body.costPrice) : undefined,
        images: [...uploadedImages, ...otherImages],   // uploaded first, then any fallback
        sizes: req.body.sizes ? JSON.parse(req.body.sizes) : [],
        colors: req.body.colors ? JSON.parse(req.body.colors) : [],
        variants: req.body.variants ? JSON.parse(req.body.variants) : [],
        tags: req.body.tags ? JSON.parse(req.body.tags) : [],
        madeInAfrica: req.body.madeInAfrica === 'true' || req.body.madeInAfrica === true,
        featured: req.body.featured === 'true' || req.body.featured === true,
        totalStock: parseInt(req.body.totalStock) || 0,
        isActive: true,   // ← EXPLICITLY SET ACTIVE so the product appears
      };

      const product = await Product.create(productData);
      res.status(201).json({
        success: true,
        message: 'Product created successfully.',
        data: { product },
      });
    } catch (error) {
      console.error('Create product error:', error);
      res.status(500).json({ success: false, message: 'Failed to create product.' });
    }
  }
);

// ── PUT /api/products/:id ── Agent only ───────────────────────────────────
router.put(
  '/:id',
  protect,
  requireAgent,
  uploadMultiple,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) {
        res.status(404).json({ success: false, message: 'Product not found.' });
        return;
      }

      const files = req.files as Express.Multer.File[];
      const newImages = files?.map(f => `/uploads/${f.filename}`) || [];

      // Images to remove (sent as JSON string by frontend)
      let removeImages: string[] = [];
      if (req.body.removeImages) {
        try {
          removeImages = JSON.parse(req.body.removeImages);
        } catch {
          removeImages = [];
        }
      }

      // Build final images array
      let currentImages = product.images || [];
      if (removeImages.length > 0) {
        currentImages = currentImages.filter(img => !removeImages.includes(img));
      }
      currentImages = [...currentImages, ...newImages];

      const updates: any = {
        ...req.body,
        ...(req.body.price && { price: parseFloat(req.body.price) }),
        ...(req.body.compareAtPrice && { compareAtPrice: parseFloat(req.body.compareAtPrice) }),
        ...(req.body.sizes && { sizes: JSON.parse(req.body.sizes) }),
        ...(req.body.colors && { colors: JSON.parse(req.body.colors) }),
        ...(req.body.variants && { variants: JSON.parse(req.body.variants) }),
        ...(req.body.tags && { tags: JSON.parse(req.body.tags) }),
        images: currentImages,
      };

      const updated = await Product.findByIdAndUpdate(
        req.params.id,
        { $set: updates },
        { new: true, runValidators: true }
      );

      res.json({ success: true, message: 'Product updated.', data: { product: updated } });
    } catch (error) {
      console.error('Update product error:', error);
      res.status(500).json({ success: false, message: 'Failed to update product.' });
    }
  }
);

// ── DELETE /api/products/:id ── Agent only ────────────────────────────────
router.delete('/:id', protect, requireAgent, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found.' });
      return;
    }
    res.json({ success: true, message: 'Product deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete product.' });
  }
});

// ── POST /api/products/:id/duplicate ── Agent only ────────────────────────
router.post('/:id/duplicate', protect, requireAgent, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const original = await Product.findById(req.params.id).lean();
    if (!original) {
      res.status(404).json({ success: false, message: 'Product not found.' });
      return;
    }

    const { _id, slug, createdAt, updatedAt, ...rest } = original as any;
    const duplicate = await Product.create({
      ...rest,
      name: `${rest.name} (Copy)`,
      featured: false,
    });

    res.status(201).json({ success: true, message: 'Product duplicated.', data: { product: duplicate } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to duplicate product.' });
  }
});

// ── PATCH /api/products/bulk-update ── Agent only ─────────────────────────
router.patch('/bulk/update', protect, requireAgent, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { ids, updates } = req.body;
    if (!ids?.length) {
      res.status(400).json({ success: false, message: 'Product IDs required.' });
      return;
    }

    const allowed = ['price', 'compareAtPrice', 'totalStock', 'isActive', 'featured', 'category'];
    const safeUpdates: Record<string, unknown> = {};
    allowed.forEach((field) => {
      if (updates[field] !== undefined) safeUpdates[field] = updates[field];
    });

    await Product.updateMany({ _id: { $in: ids } }, { $set: safeUpdates });
    res.json({ success: true, message: `${ids.length} products updated.` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Bulk update failed.' });
  }
});

export default router;