import mongoose, { Document, Schema } from 'mongoose';

export interface IBanner extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  subtitle?: string;
  image: string;
  ctaText: string;
  ctaLink: string;
  orderIndex: number;
  isActive: boolean;
  backgroundColor?: string;
  textColor?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BannerSchema = new Schema<IBanner>(
  {
    title: {
      type: String,
      required: [true, 'Banner title is required'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    subtitle: {
      type: String,
      maxlength: [200, 'Subtitle cannot exceed 200 characters'],
    },
    image: {
      type: String,
      required: [true, 'Banner image is required'],
    },
    ctaText: {
      type: String,
      required: [true, 'CTA text is required'],
      maxlength: [50, 'CTA text cannot exceed 50 characters'],
    },
    ctaLink: {
      type: String,
      required: [true, 'CTA link is required'],
    },
    orderIndex: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    backgroundColor: {
      type: String,
      default: '#000000',
    },
    textColor: {
      type: String,
      default: '#ffffff',
    },
  },
  { timestamps: true }
);

BannerSchema.index({ orderIndex: 1 });
BannerSchema.index({ isActive: 1 });

export default mongoose.model<IBanner>('Banner', BannerSchema);
