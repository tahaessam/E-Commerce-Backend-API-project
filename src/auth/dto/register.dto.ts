import { IsEmail, IsEnum, IsString, Length, Matches } from 'class-validator';
import { UserRole } from '../../common/enums/role.enum';
import { provider_role } from '../../common/enums/provider.enum';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(1, 50)
  username!: string;

  @IsString()
  @Length(6, 100)
  password!: string;

  @IsString()
  @Length(1, 20)
  phoneNumber!: string;

  @IsEnum(provider_role)
  provider!: provider_role;

  @IsEnum(UserRole)
  role!: UserRole;
}



export class RegisterDto {
  email!: string;
  phoneNumber!: string;
  password!: string;
  username!: string;
  provider!: provider_role;
  role!: UserRole;
}
