import { Router } from 'express';
import { register, login, getMe, updateMe, deleteMe, registerStart, verifyEmail, resendVerification } from '../controllers/customerController';
import { requireCustomer } from '../middleware/customerAuth';
import { validate } from '../middleware/validate';
import {
  customerRegisterSchema, customerLoginSchema, customerUpdateSchema,
  customerRegisterStartSchema, customerVerifyEmailSchema, customerResendVerificationSchema,
} from '../schemas/customer.schema';

const router = Router();

router.post('/register', validate(customerRegisterSchema), register);
router.post('/login', validate(customerLoginSchema), login);
router.post('/register-start', validate(customerRegisterStartSchema), registerStart);
router.post('/verify-email', validate(customerVerifyEmailSchema), verifyEmail);
router.post('/resend-verification', validate(customerResendVerificationSchema), resendVerification);
router.get('/me', requireCustomer, getMe);
router.patch('/me', requireCustomer, validate(customerUpdateSchema), updateMe);
router.delete('/me', requireCustomer, deleteMe);

export default router;
