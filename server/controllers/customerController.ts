import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Customer } from '../models/Customer';
import { Restaurant } from '../models/Restaurant';
import { PendingCustomerSignup } from '../models/PendingCustomerSignup';
import { env } from '../config/env';
import { CustomerRequest } from '../middleware/customerAuth';
import { sendVerificationCode } from '../services/emailService';

const CODE_TTL_MS = 15 * 60 * 1000;
const MAX_CODE_ATTEMPTS = 5;

function hashCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

function generateCode(): string {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
}

function signCustomerToken(customer: { _id: unknown; email: string }) {
  return jwt.sign(
    { id: customer._id, email: customer.email, role: 'customer' },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as any }
  );
}

// restaurantId is optional everywhere below: accounts are platform-wide, and the
// id is only recorded for attribution when the signup started inside a
// restaurant. When one is supplied it still has to be a real, active restaurant.
async function resolveAttribution(restaurantId?: string): Promise<string | undefined> {
  if (!restaurantId) return undefined;
  const restaurant = await Restaurant.findById(restaurantId).select('status');
  if (!restaurant || restaurant.status === 'inactive') return undefined;
  return String(restaurant._id);
}

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, phone, restaurantId } = req.body;
    const normalizedEmail = String(email).toLowerCase().trim();

    const existing = await Customer.findOne({ email: normalizedEmail });
    if (existing) { res.status(409).json({ message: 'Email already registered' }); return; }

    const customer = await Customer.create({
      name, email: normalizedEmail, password, phone,
      restaurantId: await resolveAttribution(restaurantId),
    });
    const token = signCustomerToken(customer);
    res.status(201).json({
      token,
      customer: { id: customer._id, name: customer.name, email: customer.email },
    });
  } catch (e) { next(e); }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email).toLowerCase().trim();

    const customer = await Customer.findOne({ email: normalizedEmail });
    if (!customer || !(await customer.comparePassword(password))) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }
    if (customer.status === 'locked') {
      res.status(403).json({ message: 'Account is locked. Please contact support.' });
      return;
    }
    const token = signCustomerToken(customer);
    res.json({
      token,
      customer: { id: customer._id, name: customer.name, email: customer.email, status: customer.status },
    });
  } catch (e) { next(e); }
};

export const getMe = async (req: CustomerRequest, res: Response, next: NextFunction) => {
  try {
    const customer = await Customer.findById(req.customer!.id).select('-password');
    if (!customer) { res.status(404).json({ message: 'Not found' }); return; }
    res.json(customer);
  } catch (e) { next(e); }
};

export const updateMe = async (req: CustomerRequest, res: Response, next: NextFunction) => {
  try {
    const { name, phone } = req.body;
    const customer = await Customer.findByIdAndUpdate(
      req.customer!.id,
      { ...(name && { name }), ...(phone !== undefined && { phone }) },
      { new: true, runValidators: true }
    ).select('-password');
    res.json(customer);
  } catch (e) { next(e); }
};

// Permanently removes the signed-in customer's account. Orders are left with the
// restaurants that fulfilled them — they are business records and carry only a
// display name, never a link back to the account.
export const deleteMe = async (req: CustomerRequest, res: Response, next: NextFunction) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.customer!.id);
    if (!customer) { res.status(404).json({ message: 'Not found' }); return; }
    await PendingCustomerSignup.deleteOne({ email: customer.email });
    res.status(204).send();
  } catch (e) { next(e); }
};

// Sends a verification code before any real Customer account exists. Verifying
// the code (via verifyEmail) creates the account and logs the customer in.
export const registerStart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, phone, restaurantId } = req.body;
    const normalizedEmail = String(email).toLowerCase().trim();

    const existing = await Customer.findOne({ email: normalizedEmail });
    if (existing) { res.status(409).json({ message: 'Email already registered' }); return; }

    const code = generateCode();
    await PendingCustomerSignup.findOneAndUpdate(
      { email: normalizedEmail },
      {
        email: normalizedEmail,
        restaurantId: await resolveAttribution(restaurantId),
        name: name.trim(), password, phone,
        verificationCodeHash: hashCode(code),
        verificationCodeExpires: new Date(Date.now() + CODE_TTL_MS),
        verificationAttempts: 0,
        createdAt: new Date(),
      },
      { upsert: true }
    );
    await sendVerificationCode(normalizedEmail, code);

    res.status(201).json({ message: 'Verification code sent. Check your email.', email: normalizedEmail });
  } catch (e) { next(e); }
};

export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, code } = req.body;
    const normalizedEmail = String(email).toLowerCase().trim();

    const pending = await PendingCustomerSignup.findOne({ email: normalizedEmail });
    if (!pending || !pending.verificationCodeHash) {
      res.status(400).json({ code: 'INVALID_CODE', message: 'Invalid verification code.' });
      return;
    }
    if (!pending.verificationCodeExpires || pending.verificationCodeExpires < new Date()) {
      res.status(400).json({ code: 'EXPIRED_CODE', message: 'This code has expired. Please request a new one.' });
      return;
    }
    if (pending.verificationAttempts >= MAX_CODE_ATTEMPTS) {
      pending.verificationCodeHash = undefined;
      pending.verificationCodeExpires = undefined;
      await pending.save();
      res.status(400).json({ code: 'TOO_MANY_ATTEMPTS', message: 'Too many incorrect attempts. Please request a new code.' });
      return;
    }
    if (hashCode(code) !== pending.verificationCodeHash) {
      pending.verificationAttempts += 1;
      await pending.save();
      res.status(400).json({ code: 'INVALID_CODE', message: 'Incorrect code. Please try again.' });
      return;
    }

    const existing = await Customer.findOne({ email: normalizedEmail });
    if (existing) {
      await PendingCustomerSignup.deleteOne({ _id: pending._id });
      res.status(409).json({ message: 'Email already registered' });
      return;
    }

    const customer = await Customer.create({
      name: pending.name,
      email: normalizedEmail,
      password: pending.password,
      phone: pending.phone,
      restaurantId: pending.restaurantId,
    });
    await PendingCustomerSignup.deleteOne({ _id: pending._id });

    const token = signCustomerToken(customer);
    res.status(201).json({
      token,
      customer: { id: customer._id, name: customer.name, email: customer.email },
    });
  } catch (e) { next(e); }
};

export const resendVerification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    const normalizedEmail = String(email).toLowerCase().trim();
    const pending = await PendingCustomerSignup.findOne({ email: normalizedEmail });
    if (pending) {
      const code = generateCode();
      pending.verificationCodeHash = hashCode(code);
      pending.verificationCodeExpires = new Date(Date.now() + CODE_TTL_MS);
      pending.verificationAttempts = 0;
      await pending.save();
      await sendVerificationCode(normalizedEmail, code);
    }
    // Always respond the same way, regardless of whether a pending signup exists, to avoid leaking which emails are registered.
    res.json({ message: 'If that signup needs verification, a new code has been sent.' });
  } catch (e) { next(e); }
};
