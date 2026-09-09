import { Link } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';
import Button from '../../../components/ui/Button';

/** Portal section — one destination module, opened from Settings console. */
export default function SettingsSectionPortal({ section }) {
  if (!section?.path) return null;
  const Icon = section.icon;

  return (
    <div className="crm-settings-portal">
      <div className="crm-settings-portal__icon" aria-hidden>
        {Icon ? <Icon strokeWidth={1.75} /> : null}
      </div>
      <div className="crm-settings-portal__copy">
        <h3>{section.label}</h3>
        <p>{section.description}</p>
      </div>
      <Link to={section.path} className="inline-flex">
        <Button type="button" variant="primary" iconRight={FiArrowRight}>
          {section.cta || 'Open'}
        </Button>
      </Link>
    </div>
  );
}
