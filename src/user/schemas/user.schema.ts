import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { UserRole } from '../../common/enums/role.enum';
import { provider_role } from '../../common/enums/provider.enum';

export type UserDocument = HydratedDocument<User>;

@Schema({
  timestamps: true,
  discriminatorKey: 'role',
})
export class User {
  _id!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  username!: string;

  @Prop({ required: true, select: false })
  password!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ trim: true })
  phoneNumber!: string;

  @Prop({ type: String, enum: provider_role, default: provider_role.User })
  provider!: provider_role;

  @Prop({
    type: String,
    enum: UserRole,
    required: true,
    default: UserRole.user,
  })
  @Prop({ default: false })
  isVerified!: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
