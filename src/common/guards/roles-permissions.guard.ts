import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { UserRole } from '../enums/role.enum';
import { getRolePermissions } from '../../Permissions/permissions.catalog';
import { PermissionRepository } from '../../Permissions/repository/permission.repositry';

type RequestUser = {
  sub?: string;
  role?: UserRole;
  permissions?: string[];
};

@Injectable()
export class RolesPermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionRepository: PermissionRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles =
      this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    const requiredPermissions =
      this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (!requiredRoles.length && !requiredPermissions.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: RequestUser }>();
    const user = request.user;

    if (!user?.role) {
      throw new ForbiddenException('Access denied');
    }

    if (requiredRoles.length && !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Role is not allowed for this resource');
    }

    if (!requiredPermissions.length) {
      return true;
    }

    const permissionSet = new Set<string>([
      ...getRolePermissions(user.role),
      ...(user.permissions ?? []),
    ]);

    if (user.sub) {
      const userPermissionDocument = await this.permissionRepository.findOne({
        userId: user.sub,
      });

      for (const permission of userPermissionDocument?.permission ?? []) {
        permissionSet.add(permission);
      }
    }

    const missingPermissions = requiredPermissions.filter(
      (permission) => !permissionSet.has(permission),
    );

    if (missingPermissions.length) {
      throw new ForbiddenException(
        `Missing permissions: ${missingPermissions.join(', ')}`,
      );
    }

    return true;
  }
}
