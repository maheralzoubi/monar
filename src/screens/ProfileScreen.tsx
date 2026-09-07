import { useState } from 'react';
import { Globe, HelpCircle, ExternalLink, Smartphone, LogOut, Trash2, User, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { getCustomerInfo, clearCustomerToken, customerFetch, CustomerInfo } from '../lib/customerAuth';

interface Props {
  onLogout?: () => void;
}

const SUPPORT_URL = 'https://www.monarllc.com/support';
const APP_VERSION = '1.2';

export const ProfileScreen = ({ onLogout }: Props) => {
  const { t } = useTranslation();
  const [customer, setCustomer] = useState<CustomerInfo | null>(() => getCustomerInfo());
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleLogout = () => {
    clearCustomerToken();
    setCustomer(null);
    onLogout?.();
  };

  const handleDeleteAccount = async () => {
    setDeleteError('');
    setDeleting(true);
    try {
      const res = await customerFetch('/api/customer/me', { method: 'DELETE' });
      if (!res.ok) { setDeleteError(t('settings.deleteFailed')); return; }
      // Account is gone — drop the local session so the app returns to signed-out.
      clearCustomerToken();
      setCustomer(null);
      setConfirmingDelete(false);
      onLogout?.();
    } catch {
      setDeleteError(t('common.networkError'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-surface min-h-screen">
      {/* Logo */}
      <div className="flex justify-center pt-16 pb-8">
        <img src="/logo-dark.svg" alt="Monar" className="h-10 w-auto" />
      </div>

      <div className="px-5 space-y-4">
        {/* Account */}
        {customer && (
          <div className="bg-surface-container rounded-2xl p-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{customer.name}</p>
              <p className="text-xs text-on-surface-variant truncate">{customer.email}</p>
            </div>
          </div>
        )}

        {/* Preferences */}
        <div className="bg-surface-container rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-surface-container-high">
            <p className="text-xs font-extrabold uppercase tracking-wider text-on-surface-variant">{t('settings.preferences')}</p>
          </div>
          <div className="px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-surface-container-high flex items-center justify-center">
                <Globe className="w-4 h-4 text-on-surface-variant" />
              </div>
              <span className="text-sm font-semibold">{t('settings.language')}</span>
            </div>
            <LanguageSwitcher />
          </div>
        </div>

        {/* About */}
        <div className="bg-surface-container rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-surface-container-high">
            <p className="text-xs font-extrabold uppercase tracking-wider text-on-surface-variant">{t('settings.about')}</p>
          </div>
          <div className="px-4 py-4 flex items-center justify-between border-b border-surface-container-high">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-surface-container-high flex items-center justify-center">
                <Smartphone className="w-4 h-4 text-on-surface-variant" />
              </div>
              <span className="text-sm font-semibold">{t('settings.appVersion')}</span>
            </div>
            <span className="text-xs text-on-surface-variant font-medium">{APP_VERSION}</span>
          </div>
          <a
            href={SUPPORT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full px-4 py-4 flex items-center justify-between active:bg-surface-container-high transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-surface-container-high flex items-center justify-center">
                <HelpCircle className="w-4 h-4 text-on-surface-variant" />
              </div>
              <span className="text-sm font-semibold">{t('settings.helpSupport')}</span>
            </div>
            <ExternalLink className="w-4 h-4 text-on-surface-variant/40" />
          </a>
        </div>

        {/* Account actions */}
        <div className="bg-surface-container rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-surface-container-high">
            <p className="text-xs font-extrabold uppercase tracking-wider text-on-surface-variant">{t('settings.account')}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-4 flex items-center gap-3 border-b border-surface-container-high active:bg-surface-container-high transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-surface-container-high flex items-center justify-center">
              <LogOut className="w-4 h-4 text-on-surface-variant rtl:rotate-180" />
            </div>
            <span className="text-sm font-semibold">{t('settings.logout')}</span>
          </button>
          <button
            onClick={() => { setDeleteError(''); setConfirmingDelete(true); }}
            className="w-full px-4 py-4 flex items-center gap-3 active:bg-surface-container-high transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">
              <Trash2 className="w-4 h-4 text-red-500" />
            </div>
            <span className="text-sm font-semibold text-red-500">{t('settings.deleteAccount')}</span>
          </button>
        </div>

        <p className="text-center text-xs text-on-surface-variant pb-6">{t('settings.poweredBy')}</p>
      </div>

      {/* Delete confirmation */}
      {confirmingDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-sm bg-surface rounded-3xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-lg font-extrabold">{t('settings.deleteTitle')}</h2>
              <p className="text-sm text-on-surface-variant leading-relaxed">{t('settings.deleteBody')}</p>
            </div>

            {deleteError && <p className="text-sm text-red-500 font-medium text-center">{deleteError}</p>}

            <div className="space-y-2 pt-1">
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="w-full py-4 rounded-2xl bg-red-500 text-white font-bold text-sm disabled:opacity-60 active:scale-95 transition-all"
              >
                {deleting ? t('settings.deleting') : t('settings.deleteConfirm')}
              </button>
              <button
                onClick={() => setConfirmingDelete(false)}
                disabled={deleting}
                className="w-full py-3.5 rounded-2xl bg-surface-container text-on-surface font-bold text-sm disabled:opacity-60 active:scale-95 transition-all"
              >
                {t('settings.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
