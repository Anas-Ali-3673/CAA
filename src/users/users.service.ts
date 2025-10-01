import { HttpException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Users } from './schema/users.schema';
import { IUser } from './interfaces/users.interface';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/createUser.dto';
import { UpdateUserDto } from './dto/updateUser.dto';
import { signUpDto } from 'src/auth/dto/signUp.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(Users.name, 'primary') private userModel: Model<IUser>) {}

  async createUser(createUserDto:signUpDto ): Promise<Omit<IUser, "password">> {
    try {
      const email = createUserDto.email.toLowerCase();
      const existingUser = await this.userModel.find({ email });
      if (existingUser.length) {
        throw new HttpException("User already exists", 400);
      }

   
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

      const user = await this.userModel.create({
        email,
        password: hashedPassword
      });

      const { password, ...userWithoutPassword } = user.toObject();
      return userWithoutPassword;
    } catch (error) {
      throw new InternalServerErrorException(`Failed to create user: ${error.message}`);
    }
  }

  async findByEmail(email: string): Promise<Omit<IUser, "password">> {
    try {
      const user = await this.userModel.findOne({ email }).exec();
      if (!user) {
        throw new HttpException('invalid credentials', 404);
      }
      const { password, ...userWithoutPassword } = user.toObject();
      return { ...userWithoutPassword };
    } catch (error) {
      throw new HttpException(`error: ${error.message}`, 404);
    }
  }

  async findByEmailWithPassword(email: string): Promise<IUser | null> {
    try {
      const user = await this.userModel.findOne({ email }).select('+password').exec();
      if (!user) {
        throw new HttpException('invalid credentials', 404);
      }
      return user;
    } catch (error) {
      throw new HttpException(`error: ${error.message}`, 404);
    }
  }

  async findUserById(id: string): Promise<Omit<IUser, "password">> {
    try {
      const user = await this.userModel.findById(id).exec();
      if (!user) {
        throw new HttpException('User not found', 404);
      }
      const { password, ...userWithoutPassword } = user.toObject();
      return { ...userWithoutPassword };
    } catch (error) {
      throw new InternalServerErrorException(`Failed to fetch user by ID: ${error.message}`);
    }
  }

  async findAllUsers(createdBy?: string): Promise<Omit<IUser, 'password'>[]> {
  try {
    const filter = createdBy ? { createdBy } : {};

    const users = await this.userModel.find(filter).select('-password').lean().exec();

    return users
  
  } catch (error) {
    throw new InternalServerErrorException(`Failed to fetch users: ${error.message}`);
  }
}



  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<IUser> {
    const updatedUser = await this.userModel.findByIdAndUpdate(id, updateUserDto, { new: true });
    if (!updatedUser) {
      throw new HttpException('User not found', 404);
    }
    return updatedUser;
  }

  async update(email: string, updateData: Partial<Users>): Promise<IUser> {
    try {
      const updatedUser = await this.userModel
        .findOneAndUpdate({ email }, updateData, { new: true })
        .exec();
      if (!updatedUser) {
        throw new HttpException('User not found', 404);
      }
      return updatedUser;
    } catch (error) {
      throw new InternalServerErrorException(`Failed to update user by email: ${error.message}`);
    }
  }

  async deleteUser(id: string): Promise<string> {
    try {
      const result = await this.userModel.findByIdAndDelete(id).exec();
      if (!result) {
        throw new HttpException('User not found', 404);
      }
      return 'User deleted';
    } catch (error) {
      throw new InternalServerErrorException(`Failed to delete user: ${error.message}`);
    }
  }

  async createUserFromProfile(createUserDto:CreateUserDto): Promise<IUser> {
    const existingUser = await this.userModel.findOne({ email: createUserDto.email }).exec();
    if (existingUser) {
      throw new HttpException('User already exists', 400);
    }
    const newUser = await this.userModel.create(createUserDto);
    return newUser.populate({path:'createdBy',select:'-password'});;
  }
  }
