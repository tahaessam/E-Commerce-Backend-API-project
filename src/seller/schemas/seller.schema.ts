import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { User } from '../../user/schemas/user.schema';

export type SellerDocument = HydratedDocument<User & Seller>;

@Schema()
export class Seller {
  @Prop({ trim: true })
  storeName?: string;

  @Prop({ trim: true })
  storeDescription?: string;

  @Prop({ default: false })
  isVerified!: boolean;
}

export const SellerSchema = SchemaFactory.createForClass(Seller);
