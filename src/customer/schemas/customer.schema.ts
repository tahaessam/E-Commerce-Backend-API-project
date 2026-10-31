import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { User } from '../../user/schemas/user.schema';

export type CustomerDocument = HydratedDocument<User & Customer>;

@Schema()
export class Customer {
  @Prop({ trim: true })
  address?: string;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);
