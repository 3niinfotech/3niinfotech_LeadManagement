/** Mock data for header panels — replace with API when backend is ready */

export const REMINDER_ITEMS = [
  {
    id: 1,
    title: 'Follow up — Interview candidate',
    dueAt: 'Today, 4:00 PM',
    type: 'Enquiry',
    isToday: true,
  },
  {
    id: 2,
    title: 'Visa document submission',
    dueAt: 'Tomorrow, 10:00 AM',
    type: 'Visa',
    isToday: false,
  },
];

export const ANNOUNCEMENTS = [
  {
    id: 1,
    title: 'scolaship',
    date: '18/05/2024',
    image: '/assets/images/announcements/nursing-career-banner.png',
    excerpt:
      'At KRS Infotech, we emphasize furnishing slice-edge IT services. We specialize in CRM software for transnational education advisors and offer Payroll, School Management, and more.',
  },
  {
    id: 2,
    title: 'Scholarship',
    date: '18/05/2024',
    image: null,
    excerpt: 'New scholarship programs are now open for international students. Contact your branch for details.',
  },
];

export const COURSE_FINDER_RECENTS = [
  { id: 1, name: 'BSc Nursing — UK', country: 'United Kingdom' },
  { id: 2, name: 'MBA — Canada', country: 'Canada' },
  { id: 3, name: 'Diploma IT — Australia', country: 'Australia' },
];

export const TASK_PREVIEW = [
  {
    id: 1,
    title: 'Interview',
    status: 'Pending',
    priority: 'High',
    dueDate: '20/06/2024',
    assignedTo: 'Krs Infotech',
  },
  {
    id: 2,
    title: 'Document verification',
    status: 'Pending',
    priority: 'Medium',
    dueDate: '22/06/2024',
    assignedTo: 'Admin',
  },
  {
    id: 3,
    title: 'Client callback',
    status: 'Complete',
    priority: 'Low',
    dueDate: '18/06/2024',
    assignedTo: 'Self',
  },
];
