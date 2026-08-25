import { NOTIFICATION_PREF_DEFAULTS } from '../../config/notificationPreferences.config';
import { STORAGE_KEYS } from '../../config/storageKeys';

function readPrefs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATION_PREFS);
    if (!raw) return { ...NOTIFICATION_PREF_DEFAULTS };
    return { ...NOTIFICATION_PREF_DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...NOTIFICATION_PREF_DEFAULTS };
  }
}

let audioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) audioCtx = new Ctx();
  return audioCtx;
}

/** Browsers require a user gesture before AudioContext can play */
export function unlockNotificationAudio() {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
}

/**
 * Soft glass-style notification chime (major arpeggio + gentle filter).
 * Pleasant / modern — not a harsh beep.
 */
export async function playNotificationSound(volume = NOTIFICATION_PREF_DEFAULTS.volume) {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch {
      return;
    }
  }

  const now = ctx.currentTime;
  const masterVol = Math.max(0, Math.min(1, Number(volume) || 0.55)) * 0.42;

  const master = ctx.createGain();
  master.gain.setValueAtTime(masterVol, now);
  master.connect(ctx.destination);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(3200, now);
  filter.Q.setValueAtTime(0.7, now);
  filter.connect(master);

  /** Soft bell partial: fundamental + quiet overtone */
  const playNote = (freq, start, duration, peak = 1) => {
    const noteGain = ctx.createGain();
    noteGain.gain.setValueAtTime(0.0001, start);
    noteGain.gain.exponentialRampToValueAtTime(Math.max(0.001, peak), start + 0.018);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    noteGain.connect(filter);

    const sine = ctx.createOscillator();
    sine.type = 'sine';
    sine.frequency.setValueAtTime(freq, start);
    sine.connect(noteGain);
    sine.start(start);
    sine.stop(start + duration + 0.02);

    const soft = ctx.createOscillator();
    soft.type = 'triangle';
    soft.frequency.setValueAtTime(freq * 2, start);
    const softGain = ctx.createGain();
    softGain.gain.setValueAtTime(0.0001, start);
    softGain.gain.exponentialRampToValueAtTime(peak * 0.12, start + 0.012);
    softGain.gain.exponentialRampToValueAtTime(0.0001, start + duration * 0.7);
    soft.connect(softGain);
    softGain.connect(filter);
    soft.start(start);
    soft.stop(start + duration + 0.02);
  };

  // Warm ascending chime: E5 → G#5 → B5 (gentle major feel)
  playNote(659.25, now, 0.38, 0.85);
  playNote(830.61, now + 0.11, 0.42, 0.72);
  playNote(987.77, now + 0.24, 0.55, 0.58);
}

export async function ensureBrowserPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

export function showBrowserNotification(notification, prefs = readPrefs()) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  if (prefs.muted || prefs.browser === false) return;

  const title = notification?.title || 'New notification';
  const body = notification?.message || notification?.body || '';
  const tag = notification?.id ? `crm-notif-${notification.id}` : 'crm-notif';

  try {
    const n = new Notification(title, {
      body,
      tag,
      renotify: true,
      silent: true, // we play our own sound
      icon: '/favicon.ico',
    });
    n.onclick = () => {
      window.focus?.();
      n.close();
      if (notification?.link) {
        window.location.assign(notification.link);
      }
    };
  } catch {
    // ignore — some browsers block without user gesture
  }
}

/**
 * Deliver realtime alert according to user preferences.
 * Browser push fires when tab is hidden (or always if browser pref on).
 */
export async function deliverNotificationAlert(notification, prefs = readPrefs()) {
  if (!notification || prefs.muted) {
    return { playedSound: false, browser: false, toast: false };
  }

  const result = { playedSound: false, browser: false, toast: Boolean(prefs.toast) };

  if (prefs.sound) {
    try {
      await playNotificationSound(prefs.volume);
      result.playedSound = true;
    } catch {
      result.playedSound = false;
    }
  }

  if (prefs.browser) {
    showBrowserNotification(notification, prefs);
    result.browser = true;
  }

  return result;
}

export function getNotificationPrefs() {
  return readPrefs();
}
