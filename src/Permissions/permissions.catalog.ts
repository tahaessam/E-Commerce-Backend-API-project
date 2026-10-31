import { UserRole } from '../common/enums/role.enum';

export const MODULE_PERMISSIONS = {
  admin: {
    create: 'admin.create',
    read: 'admin.read',
    update: 'admin.update',
    delete: 'admin.delete',
  },
  auth: {
    register: 'auth.register',
    login: 'auth.login',
    profile: 'auth.profile',
  },
  app: {
    read: 'app.read',
  },
  brand: {
    create: 'brand.create',
    read: 'brand.read',
    update: 'brand.update',
    delete: 'brand.delete',
  },
  category: {
    create: 'category.create',
    read: 'category.read',
    update: 'category.update',
    delete: 'category.delete',
  },
  customer: {
    create: 'customer.create',
    read: 'customer.read',
    update: 'customer.update',
    delete: 'customer.delete',
  },
  product: {
    create: 'product.create',
    read: 'product.read',
    update: 'product.update',
    delete: 'product.delete',
  },
  seller: {
    create: 'seller.create',
    read: 'seller.read',
    update: 'seller.update',
    delete: 'seller.delete',
  },
  user: {
    create: 'user.create',
    read: 'user.read',
    update: 'user.update',
    delete: 'user.delete',
  },
} as const;

const allPermissions = Object.values(MODULE_PERMISSIONS).flatMap(
  (modulePermissions) => Object.values(modulePermissions),
);

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  [UserRole.admin]: allPermissions,
  [UserRole.seller]: [
    MODULE_PERMISSIONS.app.read,
    MODULE_PERMISSIONS.user.read,
  ],
  [UserRole.user]: [MODULE_PERMISSIONS.app.read, MODULE_PERMISSIONS.user.read],
};

export function getRolePermissions(role: UserRole): string[] {
  return ROLE_PERMISSIONS[role] ?? [];
}
