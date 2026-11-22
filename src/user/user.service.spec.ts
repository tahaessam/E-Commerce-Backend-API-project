import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { UserRepository } from './repositories/user.repo';

describe('UserService', () => {
  let service: UserService;

  const mockUserRepository = {
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: UserRepository, useValue: mockUserRepository },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find all users', async () => {
    const users = [{ _id: '123', email: 'test@test.com' }];

    mockUserRepository.findAll.mockResolvedValue(users);

    const result = await service.findAll();

    expect(result).toEqual(users);
    expect(mockUserRepository.findAll).toHaveBeenCalled();
  });

  it('should find user by id', async () => {
    const userId = '123';
    const user = { _id: userId, email: 'test@test.com' };

    mockUserRepository.findById.mockResolvedValue(user);

    const result = await service.findOne(userId);

    expect(result).toEqual(user);
    expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
  });

  it('should update a user', async () => {
    const userId = '123';
    const updateUserDto = { username: 'updated-user' };
    const updatedUser = { _id: userId, ...updateUserDto };

    mockUserRepository.update.mockResolvedValue(updatedUser);

    const result = await service.update(userId, updateUserDto);

    expect(result).toEqual(updatedUser);
    expect(mockUserRepository.update).toHaveBeenCalledWith(
      userId,
      updateUserDto,
    );
  });

  it('should delete a user', async () => {
    const userId = '123';

    mockUserRepository.delete.mockResolvedValue(true);

    const result = await service.remove(userId);

    expect(result).toBe(true);
    expect(mockUserRepository.delete).toHaveBeenCalledWith(userId);
  });
});
