import { FiBell, FiMonitor, FiVolume2, FiVolumeX } from 'react-icons/fi';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { useNotificationPreferences } from '../../../hooks/useNotificationPreferences';
import { NOTIFICATION_PREF_LABELS } from '../../../config/notificationPreferences.config';
import {
  ensureBrowserPermission,
  playNotificationSound,
} from '../../../services/notification/alert.service';

function ToggleRow({ title, description, checked, onChange, disabled, compact }) {
  return (
    <div className={`flex items-start justify-between gap-3 ${compact ? 'py-2' : 'py-3'} ${disabled ? 'opacity-50' : ''}`}>
      <div className="min-w-0">
        <p className={`${compact ? 'text-xs' : 'text-sm'} font-medium text-text`}>{title}</p>
        {!compact && (
          <p className="text-[12px] text-text-muted mt-0.5">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative shrink-0 rounded-full transition-colors ${
          compact ? 'h-5 w-9' : 'h-6 w-11'
        } ${checked ? 'bg-brand' : 'bg-border'} disabled:cursor-not-allowed`}
      >
        <span
          className={`absolute top-0.5 left-0.5 rounded-full bg-white shadow-sm transition-transform ${
            compact ? 'h-4 w-4' : 'h-5 w-5'
          } ${checked ? (compact ? 'translate-x-4' : 'translate-x-5') : 'translate-x-0'}`}
        />
      </button>
    </div>
  );
}

export default function NotificationPreferencesCard({ compact = false, embedded = false }) {
  const { prefs, update, setMuted } = useNotificationPreferences();

  const requestBrowser = async () => {
    const permission = await ensureBrowserPermission();
    if (permission === 'granted') {
      await update({ browser: true });
    } else {
      await update({ browser: false });
    }
  };

  const testChime = async () => {
    if (prefs.muted) return;
    await playNotificationSound(prefs.volume);
  };

  const body = (
    <>
      {!embedded && (
        <div className={`flex items-start gap-2.5 ${compact ? 'mb-1' : 'mb-2'}`}>
          <span className={`flex items-center justify-center rounded-lg bg-brand-soft text-brand shrink-0 ${compact ? 'h-8 w-8' : 'h-10 w-10'}`}>
            <FiBell size={compact ? 16 : 20} />
          </span>
          <div>
            <h2 className={`${compact ? 'text-sm' : 'text-base'} font-semibold text-text`}>
              Notification alerts
            </h2>
            {!compact && (
              <p className="text-sm text-text-muted mt-0.5">
                Sound, mute, and browser alerts — including when CRM is open in another tab.
              </p>
            )}
          </div>
        </div>
      )}

      <div className={`${embedded ? '' : 'mt-1'} divide-y divide-border`}>
        <ToggleRow
          compact={compact}
          title={NOTIFICATION_PREF_LABELS.muted.title}
          description={NOTIFICATION_PREF_LABELS.muted.description}
          checked={prefs.muted}
          onChange={(v) => setMuted(v)}
        />
        <ToggleRow
          compact={compact}
          title={NOTIFICATION_PREF_LABELS.sound.title}
          description={NOTIFICATION_PREF_LABELS.sound.description}
          checked={prefs.sound}
          disabled={prefs.muted}
          onChange={(v) => update({ sound: v })}
        />
        <ToggleRow
          compact={compact}
          title={NOTIFICATION_PREF_LABELS.browser.title}
          description={NOTIFICATION_PREF_LABELS.browser.description}
          checked={prefs.browser}
          disabled={prefs.muted}
          onChange={async (v) => {
            if (v) await requestBrowser();
            else await update({ browser: false });
          }}
        />
        <ToggleRow
          compact={compact}
          title={NOTIFICATION_PREF_LABELS.toast.title}
          description={NOTIFICATION_PREF_LABELS.toast.description}
          checked={prefs.toast}
          disabled={prefs.muted}
          onChange={(v) => update({ toast: v })}
        />
        <ToggleRow
          compact={compact}
          title={NOTIFICATION_PREF_LABELS.reminderPopup.title}
          description={NOTIFICATION_PREF_LABELS.reminderPopup.description}
          checked={prefs.reminderPopup !== false}
          disabled={prefs.muted}
          onChange={(v) => update({ reminderPopup: v })}
        />
      </div>

      <div className={`${compact ? 'mt-2.5' : 'mt-4'} flex flex-wrap items-center gap-2`}>
        <Button
          size="sm"
          variant="outline"
          icon={prefs.muted ? FiVolumeX : FiVolume2}
          disabled={prefs.muted || !prefs.sound}
          onClick={testChime}
        >
          Test sound
        </Button>
        <Button
          size="sm"
          variant="outline"
          icon={FiMonitor}
          disabled={prefs.muted}
          onClick={requestBrowser}
        >
          Enable browser alerts
        </Button>
      </div>
    </>
  );

  if (embedded) {
    return <div className="crm-settings-panel-block">{body}</div>;
  }

  return (
    <Card className={compact ? 'p-3.5 max-w-none' : 'p-5 max-w-3xl'}>
      {body}
    </Card>
  );
}
