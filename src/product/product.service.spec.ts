import { ForbiddenException } from '@nestjs/common';
import { ProductService } from './product.service';
import { UserRole } from '../common/enums/role.enum';

describe('ProductService authorization', () => {
  const productRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findAll: jest.fn(),
  };
  const categoryRepository = { findById: jest.fn() };
  const brandRepository = { findById: jest.fn() };
  const sellerRepository = { findById: jest.fn() };

  let service: ProductService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ProductService(
      productRepository as any,
      categoryRepository as any,
      brandRepository as any,
      sellerRepository as any,
    );
  });

  it('assigns a seller product to the authenticated seller, ignoring a supplied seller id', async () => {
    categoryRepository.findById.mockResolvedValue({});
    sellerRepository.findById.mockResolvedValue({});
    productRepository.create.mockImplementation(async (value) => value);

    await service.create(
      {
        name: 'Product',
        description: 'Description',
        price: 10,
        quantity: 2,
        category: '64b000000000000000000001',
        seller: '64b000000000000000000002',
      },
      { sub: '64b000000000000000000003', role: UserRole.seller },
    );

    expect(sellerRepository.findById).toHaveBeenCalledWith('64b000000000000000000003');
    expect(productRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ seller: '64b000000000000000000003', soldCount: 0, rating: 0 }),
    );
  });

  it('rejects a seller trying to update another seller product', async () => {
    productRepository.findById.mockResolvedValue({
      seller: '64b000000000000000000001',
    });

    await expect(
      service.update(
        '64b000000000000000000010',
        { name: 'Changed' },
        { sub: '64b000000000000000000002', role: UserRole.seller },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(productRepository.update).not.toHaveBeenCalled();
  });

  it('rejects a seller trying to delete another seller product', async () => {
    productRepository.findById.mockResolvedValue({
      seller: '64b000000000000000000001',
    });

    await expect(
      service.remove('64b000000000000000000010', {
        sub: '64b000000000000000000002',
        role: UserRole.seller,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(productRepository.delete).not.toHaveBeenCalled();
  });
});
