import { IsEmail, IsString, Length } from 'class-validator';

export class loginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(6, 100)
  password!: string;
}

  email!: string;

  password!: string;
}
