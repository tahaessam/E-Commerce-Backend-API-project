import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Length(1, 50)
  username?: string;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  phoneNumber?: string;
}
