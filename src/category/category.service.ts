import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { CategoryRepository } from './repositories/category.repo';
import { ProductRepository } from '../product/repositories/product.repo';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryQueryDto } from './dto/category-query.dto';
import { CategoryQueryOptions } from './interfaces/category-query.interface';

type CategoryNode = {
  _id?: Types.ObjectId | string;
  parent?: Types.ObjectId | string | null;
};

@Injectable()
export class CategoryService {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly productRepository: ProductRepository,
  ) {}

  async create(createCategoryDto: CreateCategoryDto) {
    await this.ensureUniqueName(createCategoryDto.name);

    if (createCategoryDto.parent) {
      await this.ensureCategoryExists(createCategoryDto.parent);
    }

    return this.categoryRepository.create({
      ...createCategoryDto,
      name: this.normalizeName(createCategoryDto.name),
    });
  }

  async findAll(query: CategoryQueryDto) {
    const options: CategoryQueryOptions = {
      search: query.search?.trim(),
      isActive: query.isActive,
      parent: query.parent,
    };

    const filter: Record<string, unknown> = {};

    if (typeof options.isActive === 'boolean') {
      filter.isActive = options.isActive;
    }

    if (options.search) {
      filter.name = { $regex: options.search, $options: 'i' };
    }

    if (options.parent) {
      filter.parent = options.parent;
    }

    return this.categoryRepository.findAll(filter);
  }

  async findOne(id: string) {
    this.ensureValidObjectId(id, 'category id');

    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    this.ensureValidObjectId(id, 'category id');
    await this.ensureCategoryExists(id);

    if (updateCategoryDto.name) {
      await this.ensureUniqueName(updateCategoryDto.name, id);
      updateCategoryDto.name = this.normalizeName(updateCategoryDto.name);
    }

    if (updateCategoryDto.parent) {
      this.ensureValidObjectId(updateCategoryDto.parent, 'parent category id');

      if (id === updateCategoryDto.parent) {
        throw new BadRequestException('Category cannot be its own parent');
      }

      await this.ensureCategoryExists(updateCategoryDto.parent);
      await this.ensureNoCircularParent(id, updateCategoryDto.parent);
    }

    const updatedCategory = await this.categoryRepository.update(
      id,
      updateCategoryDto,
    );

    if (!updatedCategory) {
      throw new NotFoundException('Category not found');
    }

    return updatedCategory;
  }

  async remove(id: string) {
    this.ensureValidObjectId(id, 'category id');
    await this.ensureCategoryExists(id);

    const hasChildren = await this.categoryRepository.exists({
      parent: new Types.ObjectId(id),
    });

    if (hasChildren) {
      throw new ConflictException(
        'Cannot delete category that still has child categories',
      );
    }

    const hasProducts = await this.productRepository.exists({
      category: new Types.ObjectId(id),
    });

    if (hasProducts) {
      throw new ConflictException(
        'Cannot delete category that is linked to existing products',
      );
    }

    const deleted = await this.categoryRepository.delete(id);

    if (!deleted) {
      throw new NotFoundException('Category not found');
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

  private async ensureCategoryExists(id: string): Promise<void> {
    this.ensureValidObjectId(id, 'category id');

    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundException('Category not found');
    }
  }

  private async ensureUniqueName(
    name: string,
    currentId?: string,
  ): Promise<void> {
    const existingCategory = await this.categoryRepository.findOne({
      name: { $regex: `^${this.escapeRegExp(name.trim())}$`, $options: 'i' },
    });

    if (!existingCategory) {
      return;
    }

    if (
      currentId &&
      '_id' in existingCategory &&
      String(existingCategory._id) === String(currentId)
    ) {
      return;
    }

    throw new ConflictException('Category name already exists');
  }

  private async ensureNoCircularParent(
    categoryId: string,
    parentId: string,
  ): Promise<void> {
    let currentParentId: string | null = parentId;

    while (currentParentId) {
      if (currentParentId === categoryId) {
        throw new BadRequestException(
          'Circular category hierarchy is not allowed',
        );
      }

      const currentParent = (await this.categoryRepository.findById(
        currentParentId,
      )) as CategoryNode | null;

      if (!currentParent?.parent) {
        break;
      }

      currentParentId = String(currentParent.parent);
    }
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
