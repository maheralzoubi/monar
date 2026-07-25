import { useState, FormEvent } from 'react';
import { UserPlus, Eye, EyeOff, ArrowLeft, KeyRound } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { setCustomerToken, setCustomerInfo } from '../lib/customerAuth';

interface Props {
  onSuccess: () => void;
  onBack: () => void;
  onLoginClick: () => void;
  restaurantId: string;
}

type Step = 'form' | 'verify';

const ERROR_CODE_KEYS: Record<string, string> = {
  INVALID_CODE: 'customerRegister.errors.invalidCode',
  EXPIRED_CODE: 'customerRegister.errors.expiredCode',
  TOO_MANY_ATTEMPTS: 'customerRegister.errors.tooManyAttempts',
};

export const CustomerRegisterScreen = ({ onSuccess, onBack, onLoginClick, restaurantId }: Props) => {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>('form');
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [code, setCode] = useState('');
  const [resendSent, setResendSent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleStart = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/customer/register-start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, restaurantId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message ?? t('customerRegister.registrationFailed')); return; }
      setStep('verify');
    } catch {
      setError(t('common.networkError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsVerifying(true);
    try {
      const res = await fetch('/api/customer/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, code, restaurantId }),
      });
      const data = await res.json();
      if (!res.ok) {
        const key = data.code && ERROR_CODE_KEYS[data.code];
        setError(key ? t(key) : (data.message ?? t('customerRegister.registrationFailed')));
        return;
      }
      setCustomerToken(data.token);
      setCustomerInfo(data.customer);
      onSuccess();
    } catch {
      setError(t('common.networkError'));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsVerifying(true);
    setError('');
    try {
      await fetch('/api/customer/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, restaurantId }),
      });
      setCode('');
      setResendSent(true);
    } finally {
      setIsVerifying(false);
    }
  };

  if (step === 'verify') {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm space-y-8">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto">
              <KeyRound className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-headline font-extrabold">{t('customerRegister.verifyTitle')}</h1>
            <p className="text-sm text-on-surface-variant">{t('customerRegister.verifySubtitle', { email: form.email })}</p>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              required
              autoFocus
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder={t('customerRegister.codePlaceholder')}
              className="w-full bg-surface-container-low border-none rounded-2xl px-5 py-4 text-center text-2xl tracking-[0.5em] font-bold outline-none focus:ring-2 focus:ring-primary/30"
            />

            {error && <p className="text-sm text-red-500 font-medium text-center">{error}</p>}
            {resendSent && !error && <p className="text-sm text-tertiary font-medium text-center">{t('customerRegister.resendSent')}</p>}

            <button type="submit" disabled={isVerifying || code.length !== 6}
              className="w-full py-4 rounded-2xl btn-gradient text-white font-bold text-sm shadow-xl shadow-primary/20 disabled:opacity-60 transition-all">
              {isVerifying ? t('customerRegister.verifying') : t('customerRegister.verifyButton')}
            </button>
            <button type="button" onClick={handleResend} disabled={isVerifying}
              className="w-full text-sm font-bold text-primary underline disabled:opacity-60">
              {t('customerRegister.resendCode')}
            </button>
            <button type="button" onClick={() => setStep('form')} className="w-full text-sm font-bold text-on-surface-variant">
              {t('common.back')}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm space-y-8">
        <button onClick={onBack} className="flex items-center gap-2 text-on-surface-variant text-sm font-medium hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" /> {t('common.back')}
        </button>

        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto">
            <UserPlus className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-headline font-extrabold">{t('customerRegister.title')}</h1>
          <p className="text-sm text-on-surface-variant">{t('customerRegister.subtitle')}</p>
        </div>

        <form onSubmit={handleStart} className="space-y-4">
          {[
            { label: t('customerRegister.fullName'), key: 'name', type: 'text', placeholder: t('customerRegister.fullNamePlaceholder') },
            { label: t('customerLogin.email'), key: 'email', type: 'email', placeholder: t('customerLogin.emailPlaceholder') },
            { label: t('customerRegister.phone'), key: 'phone', type: 'tel', placeholder: t('customerRegister.phonePlaceholder') },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key} className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{label}</label>
              <input
                type={type}
                dir={type === 'tel' || type === 'email' ? 'ltr' : undefined}
                required={key !== 'phone'}
                value={(form as any)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full bg-surface-container-low border-none rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          ))}

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{t('customerLogin.password')}</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder={t('customerRegister.passwordPlaceholder')}
                className="w-full bg-surface-container-low border-none rounded-2xl px-5 py-4 pr-12 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-500 font-medium text-center">{error}</p>}

          <button type="submit" disabled={isLoading} className="w-full py-4 rounded-2xl btn-gradient text-white font-bold text-sm shadow-xl shadow-primary/20 disabled:opacity-60 transition-all">
            {isLoading ? t('customerRegister.creatingAccount') : t('customerRegister.createAccount')}
          </button>
        </form>

        <p className="text-center text-sm text-on-surface-variant">
          {t('customerRegister.alreadyHaveAccount')}{' '}
          <button onClick={onLoginClick} className="text-primary font-bold hover:underline">{t('customerRegister.signIn')}</button>
        </p>
      </motion.div>
    </div>
  );
};
