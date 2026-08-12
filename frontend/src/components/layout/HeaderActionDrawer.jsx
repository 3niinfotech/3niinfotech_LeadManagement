import Drawer from '../ui/Drawer';
import ReminderPanel from './header-panels/ReminderPanel';
import NotificationPanel from './header-panels/NotificationPanel';
import AnnouncementPanel from './header-panels/AnnouncementPanel';
import CourseFinderPanel from './header-panels/CourseFinderPanel';
import TaskPanel from './header-panels/TaskPanel';
import { HEADER_ACTION_DRAWER_WIDTH } from '../../config/headerActions.config';

const PANELS = {
  reminder: { title: 'Reminder', content: ReminderPanel },
  notification: { title: 'Notifications', content: NotificationPanel },
  announcement: { title: 'Announcements', content: AnnouncementPanel },
  courseFinder: { title: 'Course Finder', content: CourseFinderPanel },
  task: { title: 'Tasks', content: TaskPanel },
};

export default function HeaderActionDrawer({ actionId, open, onClose }) {
  const panel = actionId ? PANELS[actionId] : null;
  if (!panel) return null;

  const Content = panel.content;
  const width = HEADER_ACTION_DRAWER_WIDTH[actionId] || '420px';

  return (
    <Drawer open={open} onClose={onClose} title={panel.title} width={width} anchor="header">
      <Content />
    </Drawer>
  );
}
