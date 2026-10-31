import {
  Model,
  Document,
  AnyKeys,
  QueryFilter,
  QueryOptions,
  ProjectionType,
  UpdateQuery,
  HydratedDocument,
  Types,
} from 'mongoose';
//!abstract repository class to be extended by all repositories
export abstract class AbstractRepository<
  T extends Document,
  CreateDTO extends AnyKeys<T> = AnyKeys<T>,
  UpdateDTO extends UpdateQuery<T> = UpdateQuery<T>,
> {
  protected constructor(protected readonly model: Model<T>) {}

  async create(item: CreateDTO): Promise<HydratedDocument<T>> {
    return this.model.create(item);
  }

  async findAll(
    filter: QueryFilter<T> = {},
    projection?: ProjectionType<T>,
    options: QueryOptions = {},
  ): Promise<Array<HydratedDocument<T> | Partial<T>>> {
    const query = this.model.find(filter, projection, options);
    return (options.lean !== false ? query.lean() : query).exec() as any;
  }

  async findOne(
    filter: QueryFilter<T>,
    projection?: ProjectionType<T>,
    options: QueryOptions = {},
  ): Promise<HydratedDocument<T> | Partial<T> | null> {
    const query = this.model.findOne(filter, projection, options);
    return (options.lean !== false ? query.lean() : query).exec() as any;
  }

  async findById(
    id: string | Types.ObjectId,
    projection?: ProjectionType<T>,
    options: QueryOptions = {},
  ): Promise<HydratedDocument<T> | Partial<T> | null> {
    const query = this.model.findById(id, projection, options);
    return (options.lean !== false ? query.lean() : query).exec() as any;
  }

  async update(
    id: string | Types.ObjectId,
    update: UpdateDTO,
    options: QueryOptions<T> & { includeResultMetadata?: false } = {
      new: true,
    },
  ): Promise<HydratedDocument<T> | Partial<T> | null> {
    const query = this.model.findByIdAndUpdate(id, update, options);
    return (options.lean !== false ? query.lean() : query).exec() as any;
  }

  async delete(id: string | Types.ObjectId): Promise<boolean> {
    const res = await this.model.findByIdAndDelete(id).exec();
    return !!res;
  }

  async softDelete(id: string | Types.ObjectId): Promise<boolean> {
    const res = await this.model
      .findByIdAndUpdate(id, { deletedAt: new Date() })
      .exec();
    return !!res;
  }

  async count(filter: QueryFilter<T> = {}): Promise<number> {
    return this.model.countDocuments(filter).exec();
  }

  async exists(filter: QueryFilter<T>): Promise<boolean> {
    const res = await this.model.exists(filter);
    return !!res;
  }
}
