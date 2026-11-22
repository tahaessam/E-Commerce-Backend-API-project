import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { UserRole } from '../common/enums/role.enum';
import { MODULE_PERMISSIONS } from '../Permissions/permissions.catalog';

@Controller('user')
@Roles(UserRole.admin)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Permissions(MODULE_PERMISSIONS.user.read)
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  @Permissions(MODULE_PERMISSIONS.user.read)
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @Permissions(MODULE_PERMISSIONS.user.update)
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Permissions(MODULE_PERMISSIONS.user.delete)
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}