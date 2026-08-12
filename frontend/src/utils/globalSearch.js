import {
  FiUsers, FiUserPlus, FiGlobe, FiFileText, FiDollarSign, FiBriefcase,
  FiInbox, FiShield, FiClock, FiTrendingUp, FiSearch,
} from 'react-icons/fi';
import { ROUTES } from '../config/routes';
import { navPages } from '../config/navIcons.config';
import { formatHistoryAge } from './searchHistory';

export function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Split text and return parts for highlight rendering */
export function highlightParts(text, query) {
  if (!text || !query?.trim()) return [{ text, match: false }];
  const re = new RegExp(`(${escapeRegExp(query.trim())})`, 'gi');
  return text.split(re).filter(Boolean).map((part) => ({
    text: part,
    match: part.toLowerCase() === query.trim().toLowerCase(),
  }));
}

export const QUICK_SEARCHES = [
  { id: 'qs-enquiries', query: 'enquiry', label: 'Browse enquiries', icon: FiInbox },
  { id: 'qs-students', query: 'student', label: 'Find students', icon: FiUsers },
  { id: 'qs-leads', query: 'lead', label: 'Search leads', icon: FiUserPlus },
  { id: 'qs-canada', query: 'Canada', label: 'Canada enquiries', icon: FiGlobe },
];

export function filterNavPages(query) {
  if (!query?.trim()) return navPages.slice(0, 8);
  const q = query.toLowerCase();
  return navPages.filter(
    (p) => p.label.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q),
  );
}

/** Build history + trending groups when search is empty */
export function buildIdleGroups(history = [], trending = []) {
  const groups = [];

  const recent = history.slice(0, 8);
  if (recent.length) {
    groups.push({
      id: 'recent',
      label: 'Recent Searches',
      items: recent.map((h) => ({
        id: `history-${h.id}`,
        type: 'history',
        icon: FiClock,
        title: h.label || h.query,
        subtitle: h.subtitle || (h.type === 'query' ? `Searched "${h.query}"` : h.query),
        hint: formatHistoryAge(h.timestamp),
        badge: 'Recent',
        badgeColor: 'secondary',
        historyId: h.id,
        action: h.action || { kind: 'search', query: h.query },
      })),
    });
  }

  if (trending.length) {
    groups.push({
      id: 'trending',
      label: 'Trending in your searches',
      items: trending.map((t) => ({
        id: `trend-${t.query}`,
        type: 'suggestion',
        icon: FiTrendingUp,
        title: t.query,
        subtitle: `Searched ${t.count} time${t.count > 1 ? 's' : ''}`,
        badge: 'Trending',
        badgeColor: 'warning',
        action: { kind: 'search', query: t.query },
      })),
    });
  }

  groups.push({
    id: 'quick',
    label: 'Quick searches',
    items: QUICK_SEARCHES.map((q) => ({
      id: q.id,
      type: 'suggestion',
      icon: q.icon,
      title: q.label,
      subtitle: `Try "${q.query}"`,
      badge: 'Quick',
      badgeColor: 'info',
      action: { kind: 'search', query: q.query },
    })),
  });

  const pages = filterNavPages('');
  if (pages.length) {
    groups.push({
      id: 'pages',
      label: 'Quick Navigate',
      items: pages.map((p) => ({
        id: `page-${p.path}`,
        type: 'page',
        icon: p.icon,
        title: p.label,
        subtitle: p.description,
        hint: 'Press Enter to open',
        badge: 'Page',
        badgeColor: 'primary',
        action: { kind: 'navigate', path: p.path },
      })),
    });
  }

  return groups;
}

/** Build suggestion groups while typing (before full API results) */
export function buildSuggestionGroups(query, history = [], apiSuggestions = null) {
  const groups = [];
  const q = query.trim();

  const historyMatches = history
    .filter((h) =>
      h.query.toLowerCase().includes(q.toLowerCase())
      || h.label?.toLowerCase().includes(q.toLowerCase()),
    )
    .slice(0, 5);

  if (historyMatches.length) {
    groups.push({
      id: 'suggest-history',
      label: 'From your history',
      items: historyMatches.map((h) => ({
        id: `sh-${h.id}`,
        type: 'history',
        icon: FiClock,
        title: h.label || h.query,
        subtitle: h.subtitle || h.query,
        hint: formatHistoryAge(h.timestamp),
        badge: 'History',
        badgeColor: 'secondary',
        historyId: h.id,
        action: h.action || { kind: 'search', query: h.query },
      })),
    });
  }

  const pages = filterNavPages(q).slice(0, 5);
  if (pages.length) {
    groups.push({
      id: 'suggest-pages',
      label: 'Pages',
      items: pages.map((p) => ({
        id: `sp-${p.path}`,
        type: 'page',
        icon: p.icon,
        title: p.label,
        subtitle: p.description,
        badge: 'Page',
        badgeColor: 'primary',
        action: { kind: 'navigate', path: p.path },
      })),
    });
  }

  if (apiSuggestions) {
    const suggestionItems = [];
    const pushList = (list, type, icon, badge, badgeColor, mapFn) => {
      list?.forEach((row) => {
        suggestionItems.push({
          id: `sug-${type}-${row.id}`,
          type,
          icon,
          ...mapFn(row),
          badge,
          badgeColor,
          action: mapFn(row).action,
        });
      });
    };

    pushList(apiSuggestions.enquiries, 'enquiry', FiInbox, 'Enquiry', 'info', (e) => {
      const name = [e.firstName, e.lastName].filter(Boolean).join(' ');
      return {
        title: name,
        subtitle: [e.enquiryCode, e.email].filter(Boolean).join(' · '),
        hint: e.interestedCountry,
        action: { kind: 'enquiry', id: e.id, path: ROUTES.ENQUIRY_DETAIL(e.id) },
      };
    });

    pushList(apiSuggestions.students, 'student', FiUsers, 'Student', 'success', (s) => ({
      title: `${s.firstName} ${s.lastName}`,
      subtitle: [s.studentCode, s.email].filter(Boolean).join(' · '),
      action: { kind: 'navigate', path: ROUTES.STUDENT_DETAIL(s.id) },
    }));

    pushList(apiSuggestions.leads, 'lead', FiUserPlus, 'Lead', 'primary', (l) => ({
      title: `${l.firstName} ${l.lastName}`,
      subtitle: [l.email, l.country].filter(Boolean).join(' · '),
      action: { kind: 'navigate', path: ROUTES.LEAD_DETAIL(l.id) },
    }));

    if (suggestionItems.length) {
      groups.push({
        id: 'suggest-records',
        label: 'Suggestions',
        items: suggestionItems.slice(0, 8),
      });
    }
  }

  if (!groups.length && q) {
    groups.push({
      id: 'search-query',
      label: 'Search',
      items: [{
        id: 'search-all',
        type: 'suggestion',
        icon: FiSearch,
        title: `Search for "${q}"`,
        subtitle: 'Search across enquiries, students, leads & more',
        badge: 'Search',
        badgeColor: 'primary',
        action: { kind: 'search', query: q },
      }],
    });
  }

  return groups;
}

/** Build grouped search results from API + navigation */
export function buildSearchGroups(query, apiResults) {
  const groups = [];
  const pages = filterNavPages(query);

  if (pages.length) {
    groups.push({
      id: 'pages',
      label: query ? 'Pages' : 'Quick Navigate',
      items: pages.map((p) => ({
        id: `page-${p.path}`,
        type: 'page',
        icon: p.icon,
        title: p.label,
        subtitle: p.description,
        hint: 'Press Enter to open',
        badge: 'Page',
        badgeColor: 'primary',
        action: { kind: 'navigate', path: p.path },
      })),
    });
  }

  if (apiResults?.enquiries?.length) {
    groups.push({
      id: 'enquiries',
      label: 'Enquiries',
      items: apiResults.enquiries.map((e) => {
        const name = [e.firstName, e.lastName].filter(Boolean).join(' ');
        const assignee = e.assignedTo
          ? `Assigned: ${e.assignedTo.firstName} ${e.assignedTo.lastName || ''}`.trim()
          : 'Unassigned';
        return {
          id: `enquiry-${e.id}`,
          type: 'enquiry',
          icon: FiInbox,
          title: name,
          subtitle: [e.enquiryCode, e.email].filter(Boolean).join(' · '),
          hint: [e.interestedCountry, e.interestedCourse, assignee].filter(Boolean).join(' · '),
          meta: `Status: ${e.status?.replace(/_/g, ' ')}`,
          badge: 'Enquiry',
          badgeColor: 'info',
          action: { kind: 'enquiry', id: e.id, path: ROUTES.ENQUIRY_DETAIL(e.id) },
        };
      }),
    });
  }

  if (apiResults?.students?.length) {
    groups.push({
      id: 'students',
      label: 'Students',
      items: apiResults.students.map((s) => ({
        id: `student-${s.id}`,
        type: 'student',
        icon: FiUsers,
        title: `${s.firstName} ${s.lastName}`,
        subtitle: [s.studentCode, s.email, s.phone].filter(Boolean).join(' · '),
        hint: s.country ? `Country: ${s.country}` : 'Student record',
        meta: `Status: ${s.status?.replace(/_/g, ' ')}`,
        badge: 'Student',
        badgeColor: 'success',
        action: { kind: 'navigate', path: ROUTES.STUDENT_DETAIL(s.id) },
      })),
    });
  }

  if (apiResults?.leads?.length) {
    groups.push({
      id: 'leads',
      label: 'Leads',
      items: apiResults.leads.map((l) => ({
        id: `lead-${l.id}`,
        type: 'lead',
        icon: FiUserPlus,
        title: `${l.firstName} ${l.lastName}`,
        subtitle: [l.email, l.phone, l.country].filter(Boolean).join(' · '),
        hint: 'Lead record',
        meta: `Status: ${l.status}`,
        badge: 'Lead',
        badgeColor: 'primary',
        action: { kind: 'navigate', path: ROUTES.LEAD_DETAIL(l.id) },
      })),
    });
  }

  if (apiResults?.users?.length) {
    groups.push({
      id: 'users',
      label: 'Team members',
      items: apiResults.users.map((u) => ({
        id: `user-${u.id}`,
        type: 'user',
        icon: FiShield,
        title: `${u.firstName} ${u.lastName}`,
        subtitle: u.email,
        hint: [u.role?.name, u.branch?.name].filter(Boolean).join(' · '),
        badge: 'User',
        badgeColor: 'warning',
        action: { kind: 'navigate', path: ROUTES.USERS },
      })),
    });
  }

  const recordGroups = [
    { key: 'visas', label: 'Visas', icon: FiGlobe, path: ROUTES.VISAS, badge: 'Visa', badgeColor: 'info',
      map: (v) => ({
        title: `${v.student?.firstName || ''} ${v.student?.lastName || ''}`.trim() || v.country,
        subtitle: v.applicationNo || v.country,
        meta: `Visa · ${v.status}`,
      }) },
    { key: 'applications', label: 'Applications', icon: FiFileText, path: ROUTES.APPLICATIONS, badge: 'App', badgeColor: 'info',
      map: (a) => ({ title: a.university, subtitle: a.course, meta: `Application · ${a.status}` }) },
    { key: 'invoices', label: 'Invoices', icon: FiDollarSign, path: ROUTES.INVOICES, badge: 'Invoice', badgeColor: 'warning',
      map: (inv) => ({ title: inv.invoiceNo, subtitle: `Total: ${inv.total}`, meta: `Invoice · ${inv.status}` }) },
    { key: 'partners', label: 'Partners', icon: FiBriefcase, path: ROUTES.PARTNERS, badge: 'Partner', badgeColor: 'secondary',
      map: (p) => ({ title: p.name, subtitle: p.code, meta: 'Partner agency' }) },
  ];

  recordGroups.forEach(({ key, label, icon, path, badge, badgeColor, map }) => {
    const list = apiResults?.[key];
    if (!list?.length) return;
    groups.push({
      id: key,
      label,
      items: list.map((row) => {
        const mapped = map(row);
        return {
          id: `${key}-${row.id}`,
          type: key,
          icon,
          title: mapped.title,
          subtitle: mapped.subtitle,
          hint: mapped.meta,
          meta: mapped.meta,
          badge,
          badgeColor,
          action: { kind: 'navigate', path },
        };
      }),
    });
  });

  return groups;
}

export function flattenGroups(groups) {
  return groups.flatMap((g) => g.items);
}

export function getTotalCount(groups) {
  return flattenGroups(groups).length;
}
