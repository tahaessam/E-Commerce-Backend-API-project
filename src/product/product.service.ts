import {
  BadRequestException, ForbiddenException, Injectable, NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { ProductRepository } from './repositories/product.repo';
import { CategoryRepository } from '../category/repositories/category.repo';
import { BrandRepository } from '../brand/repositories/brand.repo';
import { SellerRepository } from '../seller/repositories/seller.repo';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { ProductQueryOptions } from './interfaces/product-query.interface';
import { UserRole } from '../common/enums/role.enum';

type ProductActor = { sub: string; role: UserRole };

@Injectable()
export class ProductService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly brandRepository: BrandRepository,
    private readonly sellerRepository: SellerRepository,
  ) {}

  async create(dto: CreateProductDto, actor: ProductActor) {
    const sellerId = actor.role === UserRole.seller ? actor.sub : dto.seller;
    if (!sellerId) throw new BadRequestException('A seller must be selected');
    await this.ensureCategoryExists(dto.category);
    await this.ensureSellerExists(sellerId);
    if (dto.brand) await this.ensureBrandExists(dto.brand);

    return this.productRepository.create({
      ...dto,
      seller: sellerId,
      name: dto.name.trim(),
      description: dto.description.trim(),
      isAvailable: dto.quantity > 0,
      soldCount: 0,
      rating: 0,
    });
  }

  async findAll(query: ProductQueryDto) {
    const options: ProductQueryOptions = {
      search: query.search?.trim(),
      category: query.category,
      brand: query.brand,
      seller: query.seller,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      isAvailable: query.isAvailable,
    };
    if (typeof options.minPrice === 'number' && typeof options.maxPrice === 'number' && options.minPrice > options.maxPrice) {
      throw new BadRequestException('minPrice cannot be greater than maxPrice');
    }

    const filter: Record<string, unknown> = {};
    if (options.search) {
      filter.name = {
        $regex: options.search.replace(/[.*+?^\u0024{}()|[\]\\]/g, '\\$&'),
        $options: 'i',
      };
    }
    if (options.category) filter.category = new Types.ObjectId(options.category);
    if (options.brand) filter.brand = new Types.ObjectId(options.brand);
    if (options.seller) filter.seller = new Types.ObjectId(options.seller);
    if (typeof options.isAvailable === 'boolean') filter.isAvailable = options.isAvailable;
    if (typeof options.minPrice === 'number' || typeof options.maxPrice === 'number') {
      const price: Record<string, number> = {};
      if (typeof options.minPrice === 'number') price.$gte = options.minPrice;
      if (typeof options.maxPrice === 'number') price.$lte = options.maxPrice;
      filter.price = price;
    }
    return this.productRepository.findAll(filter);
  }

  async findOne(id: string) {
    this.ensureValidObjectId(id, 'product id');
    const product = await this.productRepository.findById(id);
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async update(id: string, dto: UpdateProductDto, actor: ProductActor) {
    this.ensureValidObjectId(id, 'product id');
    const existing = await this.productRepository.findById(id);
    if (!existing) throw new NotFoundException('Product not found');
    this.ensureOwnership(existing.seller, actor);
    if (dto.category) await this.ensureCategoryExists(dto.category);
    if (dto.brand) await this.ensureBrandExists(dto.brand);
    if (dto.name) dto.name = dto.name.trim();
    if (dto.description) dto.description = dto.description.trim();
    if (typeof dto.quantity === 'number') dto.isAvailable = dto.quantity > 0;

    const updated = await this.productRepository.update(id, dto);
    if (!updated) throw new NotFoundException('Product not found');
    return updated;
  }

  async remove(id: string, actor: ProductActor) {
    this.ensureValidObjectId(id, 'product id');
    const existing = await this.productRepository.findById(id);
    if (!existing) throw new NotFoundException('Product not found');
    this.ensureOwnership(existing.seller, actor);
    const deleted = await this.productRepository.delete(id);
    if (!deleted) throw new NotFoundException('Product not found');
    return { deleted: true };
  }

  private ensureOwnership(owner: unknown, actor: ProductActor): void {
    if (actor.role === UserRole.admin) return;
    if (actor.role !== UserRole.seller || String(owner) !== actor.sub) {
      throw new ForbiddenException('You can only manage your own products');
    }
  }

  private ensureValidObjectId(id: string, label: string): void {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid ' + label);
  }

  private async ensureCategoryExists(id: string): Promise<void> {
    this.ensureValidObjectId(id, 'category id');
    if (!(await this.categoryRepository.findById(id))) throw new NotFoundException('Category not found');
  }

  private async ensureBrandExists(id: string): Promise<void> {
    this.ensureValidObjectId(id, 'brand id');
    if (!(await this.brandRepository.findById(id))) throw new NotFoundException('Brand not found');
  }

  private async ensureSellerExists(id: string): Promise<void> {
    this.ensureValidObjectId(id, 'seller id');
    if (!(await this.sellerRepository.findById(id))) throw new NotFoundException('Seller not found');
  }
}
