import mongoose, { Document, Schema } from 'mongoose';

export interface IOrderItem {
  product: mongoose.Types.ObjectId;
  name: string;
  image: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
  subtotal: number;
}

export interface IShippingAddress {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  street: string;
  city: string;
  county: string;
  country: string;
  postalCode?: string;
}

export interface IOrder extends Document {
  _id: mongoose.Types.ObjectId;
  orderNumber: string;
  customer: mongoose.Types.ObjectId;
  items: IOrderItem[];
  shippingAddress: IShippingAddress;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: 'mpesa' | 'card' | 'cod';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentReference?: string;
  stripePaymentIntentId?: string;
  mpesaReceiptNumber?: string;
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  discount?: number;
  couponCode?: string;
  notes?: string;
  trackingNumber?: string;
  estimatedDelivery?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  cancelReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  image: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  size: String,
  color: String,
  subtotal: { type: Number, required: true },
});

const ShippingAddressSchema = new Schema<IShippingAddress>({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  street: { type: String, required: true },
  city: { type: String, required: true },
  county: { type: String, required: true },
  country: { type: String, required: true, default: 'Kenya' },
  postalCode: String,
});

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      unique: true,
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer is required'],
    },
    items: [OrderItemSchema],
    shippingAddress: { type: ShippingAddressSchema, required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['mpesa', 'card', 'cod'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentReference: String,
    stripePaymentIntentId: String,
    mpesaReceiptNumber: String,
    subtotal: { type: Number, required: true },
    shippingCost: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    couponCode: String,
    notes: String,
    trackingNumber: String,
    estimatedDelivery: Date,
    deliveredAt: Date,
    cancelledAt: Date,
    cancelReason: String,
  },
  { timestamps: true }
);

// Auto-generate order number
OrderSchema.pre('save', async function (this: IOrder, next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `LS-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Indexes
OrderSchema.index({ customer: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ paymentStatus: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ orderNumber: 1 });

export default mongoose.model<IOrder>('Order', OrderSchema);
