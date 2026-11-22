import { IsEmail, IsString, Length } from 'class-validator';

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
}
