import mongoose, { Document, Schema } from 'mongoose';

export interface IVariant {
  size: string;
  color: string;
  colorHex: string;
  stock: number;
  sku?: string;
}

export interface IProduct extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  images: string[];
  category: string;
  subcategory?: string;
  brand?: string;
  tags: string[];
  sizes: string[];
  colors: Array<{ name: string; hex: string }>;
  variants: IVariant[];
  totalStock: number;
  madeInAfrica: boolean;
  featured: boolean;
  isActive: boolean;
  rating: number;
  reviewCount: number;
  soldCount: number;
  weight?: number;
  dimensions?: { length: number; width: number; height: number };
  createdAt: Date;
  updatedAt: Date;
}

const VariantSchema = new Schema<IVariant>({
  size: { type: String, required: true },
  color: { type: String, required: true },
  colorHex: { type: String, required: true },
  stock: { type: Number, required: true, min: 0, default: 0 },
  sku: String,
});

const ProductSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Name cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    shortDescription: {
      type: String,
      maxlength: [300, 'Short description cannot exceed 300 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    compareAtPrice: {
      type: Number,
      min: [0, 'Compare-at price cannot be negative'],
    },
    costPrice: {
      type: Number,
      min: [0, 'Cost price cannot be negative'],
    },
    images: [{ type: String }],
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'NEW IN',
        'WOMEN',
        'MEN',
        'KIDS',
        'ACTIVEWEAR',
        'FOOTWEAR',
        'ACCESSORIES',
        'BEAUTY',
        'MADE IN AFRICA',
        'SALE',
        'BUDGET FRIENDLY',
        'DISCOVER',
      ],
    },
    subcategory: String,
    brand: String,
    tags: [String],
    sizes: [{ type: String }],
    colors: [
      {
        name: { type: String, required: true },
        hex: { type: String, required: true },
      },
    ],
    variants: [VariantSchema],
    totalStock: { type: Number, default: 0, min: 0 },
    madeInAfrica: { type: Boolean, default: false },
    featured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    soldCount: { type: Number, default: 0 },
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Auto-generate slug from name
ProductSchema.pre('save', function (this: IProduct, next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') +
      '-' +
      Date.now().toString(36);
  }

  // Compute totalStock from variants if they exist
  if (this.variants && this.variants.length > 0) {
    this.totalStock = this.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
  }

  next();
});

// Indexes
ProductSchema.index({ name: 'text', description: 'text', tags: 'text' });
ProductSchema.index({ category: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ featured: 1 });
ProductSchema.index({ isActive: 1 });
ProductSchema.index({ madeInAfrica: 1 });
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ rating: -1 });

export default mongoose.model<IProduct>('Product', ProductSchema);
