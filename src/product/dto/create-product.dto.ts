import {
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;

  @IsNumber()
  @Min(0)
  quantity!: number;

  @IsMongoId()
  category!: string;

  @IsOptional()
  @IsMongoId()
  brand?: string;

  @IsOptional()
  @IsMongoId()
  seller?: string;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  images?: string[];
}
