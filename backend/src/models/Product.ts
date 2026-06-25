import mongoose, { Document, Schema } from 'mongoose';

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
  brand?: string;
  tags: string[];
  sizes: string[];
  colors: { name: string; hex: string }[];
  variants: any[];
  totalStock: number;
  madeInAfrica: boolean;
  featured: boolean;
  isActive: boolean;
  rating: number;
  reviewCount: number;
  soldCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    description: { type: String, required: true },
    shortDescription: { type: String, maxlength: 200 },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    costPrice: { type: Number, min: 0 },
    images: [{ type: String }],
    category: { type: String, required: true },
    brand: { type: String },
    tags: [{ type: String }],
    sizes: [{ type: String }],
    colors: [{ name: String, hex: String }],
    variants: [Schema.Types.Mixed],
    totalStock: { type: Number, default: 0, min: 0 },
    madeInAfrica: { type: Boolean, default: false },
    featured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    soldCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Text index for searching
ProductSchema.index({ name: 'text', description: 'text', tags: 'text' });
ProductSchema.index({ category: 1 });
ProductSchema.index({ slug: 1 });

export default mongoose.model<IProduct>('Product', ProductSchema);