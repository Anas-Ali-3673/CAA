import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { UpdateUserDto } from './dto/updateUser.dto';
import { IUser } from './interfaces/users.interface';
import { AuthGuard } from 'src/auth/auth.guard';
import { CreateUserDto } from './dto/createUser.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
 
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUserFromProfile(createUserDto);
  }

  @Get(':id')
  
  async getUserById(@Param('id') id: string) {
    return this.usersService.findUserById(id);
  }

  @Get()
  @UseGuards(AuthGuard)
  async getAllUsers()  {
    const users = await this.usersService.findAllUsers();
    return users;
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
 

  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.updateUser(id, updateUserDto);
  }


@UseGuards(AuthGuard)
  @Delete(':id')
  
  async deleteUser(@Param('id') id: string) {
    const user = await this.usersService.deleteUser(id);
    if (!user) {
      throw new HttpException('User not found', 404);
    }
    return 'User deleted';
  }


}
