const STORAGE_KEY = 'crm.courseFinder.recents';
const MAX_RECENTS = 8;

export function readCourseFinderRecents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function pushCourseFinderRecent(entry) {
  if (!entry?.name?.trim()) return readCourseFinderRecents();
  const next = [
    {
      id: entry.id || `${entry.name}-${entry.country || ''}`,
      name: entry.name.trim(),
      country: entry.country?.trim() || '',
    },
    ...readCourseFinderRecents().filter((r) => r.name !== entry.name),
  ].slice(0, MAX_RECENTS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
