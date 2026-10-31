import { UserRole } from '../../common/enums/role.enum';
import { provider_role } from '../../common/enums/provider.enum';

export class CreateUserDto {
  username?: string;
  password?: string;
  email?: string;
  phoneNumber?: string;
  provider?: provider_role;
  role?: UserRole;
  isSuperAdmin?: boolean;
  storeName?: string;
  storeDescription?: string;
  isVerified?: boolean;
  address?: string;
}
