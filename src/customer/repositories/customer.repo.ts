import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AbstractRepository } from '../../database/abstract.repo';
import { Customer, CustomerDocument } from '../schemas/customer.schema';

@Injectable()
export class CustomerRepository extends AbstractRepository<CustomerDocument> {
  constructor(
    @InjectModel(Customer.name)
    private readonly customerModel: Model<CustomerDocument>,
  ) {
    super(customerModel);
  }
}
