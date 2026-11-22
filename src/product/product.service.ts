import {
  BadRequestException,
  Injectable,
  NotFoundException,
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

@Injectable()
export class ProductService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly brandRepository: BrandRepository,
    private readonly sellerRepository: SellerRepository,
  ) {}

  async create(createProductDto: CreateProductDto) {
    await this.ensureCategoryExists(createProductDto.category);
    await this.ensureSellerExists(createProductDto.seller);

    if (createProductDto.brand) {
      await this.ensureBrandExists(createProductDto.brand);
    }

    const payload = {
      ...createProductDto,
      name: createProductDto.name.trim(),
      description: createProductDto.description.trim(),
      isAvailable:
        createProductDto.isAvailable ?? Number(createProductDto.quantity) > 0,
    };

    return this.productRepository.create(payload);
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

    if (
      typeof options.minPrice === 'number' &&
      typeof options.maxPrice === 'number' &&
      options.minPrice > options.maxPrice
    ) {
      throw new BadRequestException('minPrice cannot be greater than maxPrice');
    }

    const filter: Record<string, unknown> = {};

    if (options.search) {
      filter.name = {
        $regex: options.search.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\filter.name = { $regex: options.search, $options: 'i' };'),
        $options: 'i',
      };
    }

    if (options.category) {
      filter.category = new Types.ObjectId(options.category);
    }

    if (options.brand) {
      filter.brand = new Types.ObjectId(options.brand);
    }

    if (options.seller) {
      filter.seller = new Types.ObjectId(options.seller);
    }

    if (typeof options.isAvailable === 'boolean') {
      filter.isAvailable = options.isAvailable;
    }

    if (
      typeof options.minPrice === 'number' ||
      typeof options.maxPrice === 'number'
    ) {
      const priceFilter: Record<string, number> = {};

      if (typeof options.minPrice === 'number') {
        priceFilter.$gte = options.minPrice;
      }

      if (typeof options.maxPrice === 'number') {
        priceFilter.$lte = options.maxPrice;
      }

      filter.price = priceFilter;
    }

    return this.productRepository.findAll(filter);
  }

  async findOne(id: string) {
    this.ensureValidObjectId(id, 'product id');

    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    this.ensureValidObjectId(id, 'product id');
    await this.ensureProductExists(id);

    if (updateProductDto.category) {
      await this.ensureCategoryExists(updateProductDto.category);
    }

    if (updateProductDto.brand) {
      await this.ensureBrandExists(updateProductDto.brand);
    }

    if (updateProductDto.seller) {
      await this.ensureSellerExists(updateProductDto.seller);
    }

    if (updateProductDto.name) {
      updateProductDto.name = updateProductDto.name.trim();
    }

    if (updateProductDto.description) {
      updateProductDto.description = updateProductDto.description.trim();
    }

    if (typeof updateProductDto.quantity === 'number') {
      updateProductDto.isAvailable = updateProductDto.quantity > 0;
    }

    const updatedProduct = await this.productRepository.update(
      id,
      updateProductDto,
    );

    if (!updatedProduct) {
      throw new NotFoundException('Product not found');
    }

    return updatedProduct;
  }

  async remove(id: string) {
    this.ensureValidObjectId(id, 'product id');
    await this.ensureProductExists(id);

    const deleted = await this.productRepository.delete(id);
    if (!deleted) {
      throw new NotFoundException('Product not found');
    }

    return { deleted: true };
  }

  private ensureValidObjectId(id: string, label: string): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid ${label}`);
    }
  }

  private async ensureProductExists(id: string): Promise<void> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
  }

  private async ensureCategoryExists(id: string): Promise<void> {
    this.ensureValidObjectId(id, 'category id');

    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundException('Category not found');
    }
  }

  private async ensureBrandExists(id: string): Promise<void> {
    this.ensureValidObjectId(id, 'brand id');

    const brand = await this.brandRepository.findById(id);
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }
  }

  private async ensureSellerExists(id: string): Promise<void> {
    this.ensureValidObjectId(id, 'seller id');

    const seller = await this.sellerRepository.findById(id);
    if (!seller) {
      throw new NotFoundException('Seller not found');
    }
  }
}
