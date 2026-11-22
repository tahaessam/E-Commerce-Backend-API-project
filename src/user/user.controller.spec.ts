import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserRepository } from './repositories/user.repo';

describe('UserController', () => {
  let controller: UserController;

  const mockUserRepository = {
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        UserService,
        { provide: UserRepository, useValue: mockUserRepository },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should find all users', async () => {
    const users = [{ _id: '123', email: 'test@test.com' }];

    mockUserRepository.findAll.mockResolvedValue(users);

    const result = await controller.findAll();

    expect(result).toEqual(users);
  });

  it('should find user by id', async () => {
    const userId = '123';
    const user = { _id: userId, email: 'test@test.com' };

    mockUserRepository.findById.mockResolvedValue(user);

    const result = await controller.findOne(userId);

    expect(result).toEqual(user);
  });

  it('should update a user', async () => {
    const userId = '123';
    const updateUserDto = { username: 'updated-user' };
    const updatedUser = { _id: userId, ...updateUserDto };

    mockUserRepository.update.mockResolvedValue(updatedUser);

    const result = await controller.update(userId, updateUserDto);

    expect(result).toEqual(updatedUser);
  });

  it('should delete a user', async () => {
    const userId = '123';

    mockUserRepository.delete.mockResolvedValue(true);

    const result = await controller.remove(userId);

    expect(result).toBe(true);
  });
});
