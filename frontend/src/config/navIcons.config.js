import { sidebarConfig } from './sidebar.config';

export function flattenNavItems(items = sidebarConfig) {
  const flat = [];
  items.forEach((item) => {
    if (item.path) {
      flat.push({ id: item.id, label: item.label, description: item.description, path: item.path, icon: item.icon });
    }
    item.children?.forEach((child) => {
      flat.push({
        id: child.id,
        label: child.label,
        description: child.description,
        path: child.path,
        icon: child.icon || item.icon,
      });
    });
  });
  return flat;
}

export const navPages = flattenNavItems();

export const getNavByPath = (path) => navPages.find((item) => item.path === path);

export const getNavIcon = (path) => getNavByPath(path)?.icon;

export const getNavLabel = (path) => getNavByPath(path)?.label;
