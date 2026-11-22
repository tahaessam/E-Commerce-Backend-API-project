import { Injectable } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRepository } from '../user/repositories/user.repo';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  findAll() {
    return this.userRepository.findAll();
  }

  findOne(id: string) {
    return this.userRepository.findById(id);
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    return this.userRepository.update(id, updateUserDto);
  }

  remove(id: string) {
    return this.userRepository.delete(id);
  }
}
