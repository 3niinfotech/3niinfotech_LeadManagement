import { FiBell, FiMonitor, FiVolume2, FiVolumeX } from 'react-icons/fi';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { useNotificationPreferences } from '../../../hooks/useNotificationPreferences';
import { NOTIFICATION_PREF_LABELS } from '../../../config/notificationPreferences.config';
import {
  ensureBrowserPermission,
  playNotificationSound,
} from '../../../services/notification/alert.service';

function ToggleRow({ title, description, checked, onChange, disabled }) {
  return (
    <div className={`flex items-start justify-between gap-4 py-3 ${disabled ? 'opacity-50' : ''}`}>
      <div className="min-w-0">
        <p className="text-sm font-medium text-text">{title}</p>
        <p className="text-[12px] text-text-muted mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-brand' : 'bg-border'
        } disabled:cursor-not-allowed`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

export default function NotificationPreferencesCard() {
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

  return (
    <Card className="p-5 max-w-3xl">
      <div className="flex items-start gap-3 mb-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-soft text-brand shrink-0">
          <FiBell size={20} />
        </span>
        <div>
          <h2 className="text-base font-semibold text-text">Notification alerts</h2>
          <p className="text-sm text-text-muted mt-0.5">
            Sound, mute, and browser alerts — including when CRM is open in another tab.
          </p>
        </div>
      </div>

      <div className="mt-2 divide-y divide-border">
        <ToggleRow
          title={NOTIFICATION_PREF_LABELS.muted.title}
          description={NOTIFICATION_PREF_LABELS.muted.description}
          checked={prefs.muted}
          onChange={(v) => setMuted(v)}
        />
        <ToggleRow
          title={NOTIFICATION_PREF_LABELS.sound.title}
          description={NOTIFICATION_PREF_LABELS.sound.description}
          checked={prefs.sound}
          disabled={prefs.muted}
          onChange={(v) => update({ sound: v })}
        />
        <ToggleRow
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
          title={NOTIFICATION_PREF_LABELS.toast.title}
          description={NOTIFICATION_PREF_LABELS.toast.description}
          checked={prefs.toast}
          disabled={prefs.muted}
          onChange={(v) => update({ toast: v })}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
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
        <p className="text-[11px] text-text-muted w-full sm:w-auto sm:ml-auto">
          Browser alerts need one-time permission from your browser.
        </p>
      </div>
    </Card>
  );
}
