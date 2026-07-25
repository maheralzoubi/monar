import mongoose, { Document, Schema } from 'mongoose';

// Holds a not-yet-verified customer signup while the email code is pending,
// before the real Customer account exists. Auto-expires via TTL so abandoned
// signups don't linger. Mirrors server/models/PendingSignup.ts (owner signup)
// but scoped per-restaurant, matching Customer's per-restaurant uniqueness.
export interface IPendingCustomerSignup extends Document {
  email: string;
  restaurantId: mongoose.Types.ObjectId;
  name: string;
  password: string;
  phone?: string;
  verificationCodeHash?: string;
  verificationCodeExpires?: Date;
  verificationAttempts: number;
  createdAt: Date;
}

const PendingCustomerSignupSchema = new Schema<IPendingCustomerSignup>({
  email: { type: String, required: true, lowercase: true, trim: true },
  restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  name: { type: String, required: true, trim: true },
  password: { type: String, required: true },
  phone: { type: String, trim: true },
  verificationCodeHash: { type: String },
  verificationCodeExpires: { type: Date },
  verificationAttempts: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now, expires: 7200 }, // TTL: 2 hours
});

PendingCustomerSignupSchema.index({ email: 1, restaurantId: 1 }, { unique: true });

export const PendingCustomerSignup = mongoose.model<IPendingCustomerSignup>(
  'PendingCustomerSignup',
  PendingCustomerSignupSchema
);
