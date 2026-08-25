import { sidebarConfig } from './sidebar.config';

export function flattenNavItems(items = sidebarConfig) {
  const flat = [];
  const walk = (list, inheritedIcon) => list.forEach((item) => {
    const icon = item.icon || inheritedIcon;
    if (item.path) {
      flat.push({
        id: item.id,
        label: item.label,
        description: item.description,
        path: item.path,
        icon,
        permission: item.permission,
        permissions: item.permissions,
        keywords: item.keywords,
      });
    }
    if (item.children?.length) walk(item.children, icon);
  });
  walk(items);
  return flat;
}

export const navPages = flattenNavItems();

export const getNavByPath = (path) => navPages.find((item) => item.path === path);

export const getNavIcon = (path) => getNavByPath(path)?.icon;

export const getNavLabel = (path) => getNavByPath(path)?.label;
