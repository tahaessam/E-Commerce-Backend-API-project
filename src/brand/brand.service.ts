import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { BrandRepository } from './repositories/brand.repo';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { BrandQueryDto } from './dto/brand-query.dto';
import { BrandQueryOptions } from './interfaces/brand-query.interface';

@Injectable()
export class BrandService {
  constructor(private readonly brandRepository: BrandRepository) {}

  async create(createBrandDto: CreateBrandDto) {
    await this.ensureUniqueName(createBrandDto.name);

    return this.brandRepository.create({
      ...createBrandDto,
      name: this.normalizeName(createBrandDto.name),
    });
  }

  async findAll(query: BrandQueryDto) {
    const options: BrandQueryOptions = {
      search: query.search?.trim(),
      isActive: query.isActive,
    };

    const filter: Record<string, unknown> = {};

    if (typeof options.isActive === 'boolean') {
      filter.isActive = options.isActive;
    }

    if (options.search) {
      filter.name = { $regex: options.search, $options: 'i' };
    }

    return this.brandRepository.findAll(filter);
  }

  async findOne(id: string) {
    this.ensureValidObjectId(id, 'brand id');

    const brand = await this.brandRepository.findById(id);
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    return brand;
  }

  async update(id: string, updateBrandDto: UpdateBrandDto) {
    this.ensureValidObjectId(id, 'brand id');
    await this.ensureBrandExists(id);

    if (updateBrandDto.name) {
      await this.ensureUniqueName(updateBrandDto.name, id);
      updateBrandDto.name = this.normalizeName(updateBrandDto.name);
    }

    const updatedBrand = await this.brandRepository.update(id, updateBrandDto);
    if (!updatedBrand) {
      throw new NotFoundException('Brand not found');
    }

    return updatedBrand;
  }

  async remove(id: string) {
    this.ensureValidObjectId(id, 'brand id');
    await this.ensureBrandExists(id);

    const deleted = await this.brandRepository.delete(id);
    if (!deleted) {
      throw new NotFoundException('Brand not found');
    }

    return { deleted: true };
  }

  private normalizeName(name: string): string {
    return name.trim();
  }

  private ensureValidObjectId(id: string, label: string): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid ${label}`);
    }
  }

  private async ensureBrandExists(id: string): Promise<void> {
    const brand = await this.brandRepository.findById(id);
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }
  }

  private async ensureUniqueName(
    name: string,
    currentId?: string,
  ): Promise<void> {
    const existingBrand = await this.brandRepository.findOne({
      name: { $regex: `^${this.escapeRegExp(name.trim())}$`, $options: 'i' },
    });

    if (!existingBrand) {
      return;
    }

    if (
      currentId &&
      '_id' in existingBrand &&
      String(existingBrand._id) === String(currentId)
    ) {
      return;
    }

    throw new ConflictException('Brand name already exists');
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
