import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Admin, AdminSchema } from '../admin/schemas/admin.schema';
import { AdminRepository } from '../admin/repositories/admin.repo';
import { Brand, BrandSchema } from '../brand/schemas/brand.schema';
import { BrandRepository } from '../brand/repositories/brand.repo';
import { Category, CategorySchema } from '../category/schemas/category.schema';
import { CategoryRepository } from '../category/repositories/category.repo';
import { Customer, CustomerSchema } from '../customer/schemas/customer.schema';
import { CustomerRepository } from '../customer/repositories/customer.repo';
import { Product, ProductSchema } from '../product/schemas/product.schema';
import { ProductRepository } from '../product/repositories/product.repo';
import { Seller, SellerSchema } from '../seller/schemas/seller.schema';
import { SellerRepository } from '../seller/repositories/seller.repo';
import { User, UserSchema } from '../user/schemas/user.schema';
import { UserRepository } from '../user/repositories/user.repo';
import { UserRole } from '../common/enums/role.enum';
import {
  Permission,
  permissionSchema,
} from '../Permissions/schema/permission.schema';
import { PermissionRepository } from '../Permissions/repository/permission.repositry';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Brand.name, schema: BrandSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Product.name, schema: ProductSchema },
      {
        name: User.name,
        schema: UserSchema,
        discriminators: [
          { name: Admin.name, schema: AdminSchema, value: UserRole.admin },
          { name: Seller.name, schema: SellerSchema, value: UserRole.seller },
          { name: Customer.name, schema: CustomerSchema, value: UserRole.user },
        ],
      },
      { name: Permission.name, schema: permissionSchema },
    ]),
  ],
  providers: [
    AdminRepository,
    BrandRepository,
    CategoryRepository,
    CustomerRepository,
    ProductRepository,
    SellerRepository,
    UserRepository,
    PermissionRepository,
  ],
  exports: [
    MongooseModule,
    AdminRepository,
    BrandRepository,
    CategoryRepository,
    CustomerRepository,
    ProductRepository,
    SellerRepository,
    UserRepository,
    PermissionRepository,
  ],
})
export class SharedModule {}
