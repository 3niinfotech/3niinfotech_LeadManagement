import prisma from '../../config/database.js';
import { hasPermission, normalizePermissionKey } from './rbac.util.js';

function filterMenuTree(items, userPermissions) {
  return items
    .map((item) => {
      const children = item.children?.length
        ? filterMenuTree(item.children, userPermissions)
        : [];

      const key = item.permissionKey ? normalizePermissionKey(item.permissionKey) : null;
      const allowed = !key || hasPermission(userPermissions, key);

      if (!allowed && !children.length) return null;

      return {
        id: item.id,
        name: item.name,
        icon: item.icon,
        route: item.route,
        permissionKey: item.permissionKey,
        displayOrder: item.displayOrder,
        children,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

async function loadMenuTree(parentId = null) {
  const items = await prisma.menuItem.findMany({
    where: { isActive: true, parentId },
    orderBy: { displayOrder: 'asc' },
  });

  return Promise.all(
    items.map(async (item) => ({
      ...item,
      children: await loadMenuTree(item.id),
    })),
  );
}

export const menuService = {
  getForUser: async (userPermissions = []) => {
    const items = await loadMenuTree(null);
    return filterMenuTree(items, userPermissions);
  },
};
