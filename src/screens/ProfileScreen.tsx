import { useState } from 'react';
import { Globe, HelpCircle, ExternalLink, Smartphone, LogOut, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { getCustomerInfo, clearCustomerToken, CustomerInfo } from '../lib/customerAuth';

interface Props {
  onLogout?: () => void;
}

const SUPPORT_URL = 'https://www.monarllc.com/support';
const APP_VERSION = '1.2';

export const ProfileScreen = ({ onLogout }: Props) => {
  const { t } = useTranslation();
  const [customer, setCustomer] = useState<CustomerInfo | null>(() => getCustomerInfo());

  const handleLogout = () => {
    clearCustomerToken();
    setCustomer(null);
    onLogout?.();
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
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-container-high text-red-500 text-xs font-bold active:scale-95 transition-transform shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              {t('settings.logout')}
            </button>
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

        <p className="text-center text-xs text-on-surface-variant pb-6">{t('settings.poweredBy')}</p>
      </div>
    </div>
  );
};
