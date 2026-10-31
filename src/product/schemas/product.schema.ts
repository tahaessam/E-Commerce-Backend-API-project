import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Brand } from '../../brand/schemas/brand.schema';
import { Category } from '../../category/schemas/category.schema';
import { Seller } from '../../seller/schemas/seller.schema';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ timestamps: true })
export class Product {
  _id!: Types.ObjectId;

  @Prop({
    required: true,
    trim: true,
  })
  name!: string;

  @Prop({
    required: true,
    trim: true,
  })
  description!: string;

  @Prop({
    required: true,
    min: 0,
  })
  price!: number;

  @Prop({
    required: true,
    min: 0,
    default: 0,
  })
  quantity!: number;

  @Prop({ type: Types.ObjectId, ref: Category.name, required: true })
  category!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Brand.name })
  brand?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Seller.name, required: true })
  seller!: Types.ObjectId;

  @Prop({
    default: [],
  })
  images!: string[];

  @Prop({
    default: true,
  })
  isAvailable!: boolean;

  @Prop({
    default: 0,
    min: 0,
  })
  soldCount!: number;

  @Prop({
    min: 0,
    max: 5,
    default: 0,
  })
  rating!: number;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
