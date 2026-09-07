import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface ICustomer extends Document {
  email: string;
  password: string;
  name: string;
  phone?: string;
  status: 'active' | 'locked';
  /** Restaurant the customer first signed up at. Attribution only — accounts are platform-wide. */
  restaurantId?: mongoose.Types.ObjectId;
  comparePassword(candidate: string): Promise<boolean>;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    status: { type: String, enum: ['active', 'locked'], default: 'active' },
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant' },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// One account per email across the whole platform, so a customer signs in once
// and can order from any restaurant.
CustomerSchema.index({ email: 1 }, { unique: true });

CustomerSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

CustomerSchema.methods.comparePassword = function (candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

export const Customer = mongoose.model<ICustomer>('Customer', CustomerSchema);
