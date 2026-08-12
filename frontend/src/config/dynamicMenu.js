import * as FiIcons from 'react-icons/fi';

export const resolveNavIcon = (iconName) => {
  if (!iconName) return FiIcons.FiCircle;
  return FiIcons[iconName] || FiIcons.FiCircle;
};

export function mapDynamicMenuItems(items = []) {
  return items.map((item) => ({
    id: item.id || item.name?.toLowerCase().replace(/\s+/g, '-'),
    label: item.name,
    description: item.name,
    icon: resolveNavIcon(item.icon),
    path: item.route || undefined,
    permission: item.permissionKey,
    children: item.children?.length
      ? mapDynamicMenuItems(item.children)
      : undefined,
  }));
}
