import {
  Body, Controller, Delete, Get, Param, Patch, Post, Query, Req,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/role.enum';
import { Permissions } from '../common/decorators/permissions.decorator';
import { MODULE_PERMISSIONS } from '../Permissions/permissions.catalog';

type AuthenticatedRequest = { user: { sub: string; role: UserRole } };

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @Roles(UserRole.admin, UserRole.seller)
  @Permissions(MODULE_PERMISSIONS.product.create)
  create(@Body() dto: CreateProductDto, @Req() request: AuthenticatedRequest) {
    return this.productService.create(dto, request.user);
  }

  @Get()
  @Roles(UserRole.admin, UserRole.seller, UserRole.user)
  @Permissions(MODULE_PERMISSIONS.product.read)
  findAll(@Query() query: ProductQueryDto) {
    return this.productService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.admin, UserRole.seller, UserRole.user)
  @Permissions(MODULE_PERMISSIONS.product.read)
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.admin, UserRole.seller)
  @Permissions(MODULE_PERMISSIONS.product.update)
  update(@Param('id') id: string, @Body() dto: UpdateProductDto, @Req() request: AuthenticatedRequest) {
    return this.productService.update(id, dto, request.user);
  }

  @Delete(':id')
  @Roles(UserRole.admin, UserRole.seller)
  @Permissions(MODULE_PERMISSIONS.product.delete)
  remove(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.productService.remove(id, request.user);
  }
}
