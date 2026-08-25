import { Link } from 'react-router-dom';
import { footerConfig } from '../../config/footer.config';
import { useCompanyRuntime } from '../../features/organization/CompanyRuntime';

export default function AppFooter() {
  const year = new Date().getFullYear();
  const { company, settings } = useCompanyRuntime();
  const social = [
    settings.socialLinkedin && { id: 'li', label: 'LinkedIn', href: settings.socialLinkedin },
    settings.socialInstagram && { id: 'ig', label: 'Instagram', href: settings.socialInstagram },
    settings.socialTwitter && { id: 'tw', label: 'Twitter', href: settings.socialTwitter },
    settings.socialYoutube && { id: 'yt', label: 'YouTube', href: settings.socialYoutube },
    settings.socialPinterest && { id: 'pin', label: 'Pinterest', href: settings.socialPinterest },
    settings.socialFacebook && { id: 'fb', label: 'Facebook', href: settings.socialFacebook },
  ].filter(Boolean);

  return (
    <footer className="shrink-0 z-[1000] border-t border-border bg-card-bg/95 backdrop-blur-md">
      <div className="px-5 lg:px-6 py-2.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[11px] sm:text-xs text-text-muted text-center sm:text-left shrink-0">
          © {year} {company?.name || footerConfig.brand.product}
        </p>

        <nav
          className="flex flex-wrap items-center justify-center gap-1 sm:gap-0.5"
          aria-label="Footer navigation"
        >
          {footerConfig.links.map(({ id, label, path }, index) => (
            <span key={id} className="inline-flex items-center">
              {index > 0 && (
                <span className="hidden sm:inline text-text-muted/40 mx-1.5 select-none" aria-hidden>
                  ·
                </span>
              )}
              <Link
                to={path}
                className="px-2 py-1 rounded-md text-[11px] sm:text-xs font-medium text-text-secondary
                  hover:text-primary-600 hover:bg-brand-soft transition-colors duration-150 focus-ring"
              >
                {label}
              </Link>
            </span>
          ))}
          {social.map((item) => (
            <a
              key={item.id}
              href={item.href}
              target="_blank"
              rel="noreferrer"
              className="px-2 py-1 rounded-md text-[11px] sm:text-xs font-medium text-text-secondary hover:text-primary-600"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
