import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AbstractRepository } from '../../database/abstract.repo';
import { Seller, SellerDocument } from '../schemas/seller.schema';

@Injectable()
export class SellerRepository extends AbstractRepository<SellerDocument> {
  constructor(
    @InjectModel(Seller.name)
    private readonly sellerModel: Model<SellerDocument>,
  ) {
    super(sellerModel);
  }
}
