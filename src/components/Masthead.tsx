import { useI18n } from '../i18n/I18nProvider';
import { LanguageToggle } from './LanguageToggle';

/**
 * Brand masthead: Full Stacked negative lockup (unaltered; its transparent padding is the clear space)
 * and the FAST Matrix, used once, as a CSS background crop. In RTL the Matrix moves to the opposite
 * side; it is never mirrored (flipping is a listed brand misuse).
 */
export function Masthead() {
  const { t } = useI18n();
  return (
    <header className="masthead">
      <div className="masthead__bar">
        <img
          className="masthead__logo"
          src="/brand/full-stacked-negative.png"
          alt={t('brand.logoAlt')}
          width={240}
          height={98}
        />
        <div className="masthead__portal">
          <p className="masthead__portal-name">{t('portal.name')}</p>
          <p className="masthead__portal-place">{t('portal.place')}</p>
        </div>
        <LanguageToggle />
      </div>
      <div className="masthead__matrix" aria-hidden="true" />
    </header>
  );
}
