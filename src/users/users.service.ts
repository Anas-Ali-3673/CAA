import { HttpException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Users } from './schema/users.schema';
import { IUser } from './interfaces/users.interface';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/createUser.dto';
import { UpdateUserDto } from './dto/updateUser.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(Users.name, 'primary') private primaryUserModel: Model<IUser>,
    @InjectModel(Users.name, 'fallback') private fallbackUserModel: Model<IUser>
  ) {}

  async createUser(createUserDto:CreateUserDto ): Promise<Omit<IUser, "password">> {
    try {
      const email = createUserDto.email.toLowerCase();
      let existingUser;
      try {
        existingUser = await this.primaryUserModel.find({ email });
      } catch (error) {
        existingUser = await this.fallbackUserModel.find({ email });
      }
      
      if (existingUser.length) {
        throw new HttpException("User already exists", 400);
      }

      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

      let user;
      try {
        user = await this.primaryUserModel.create({
          ...createUserDto,
          email,
          password: hashedPassword
        });
        // Sync to fallback
        try {
          await this.fallbackUserModel.create({
            _id: user._id,
            ...createUserDto,
            email,
            password: hashedPassword,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          });
        } catch (fallbackError) {
          console.warn('Failed to sync user to fallback:', fallbackError.message);
        }
      } catch (primaryError) {
        console.warn('Primary database failed, creating user in fallback:', primaryError.message);
        user = await this.fallbackUserModel.create({
          ...createUserDto,
          email,
          password: hashedPassword
        });
      }

      const { password, ...userWithoutPassword } = user.toObject();
      return userWithoutPassword;
    } catch (error) {
      throw new InternalServerErrorException(`Failed to create user: ${error.message}`);
    }
  }

  async findByEmail(email: string): Promise<Omit<IUser, "password">> {
    try {
      let user;
      try {
        user = await this.primaryUserModel.findOne({ email }).exec();
      } catch (error) {
        user = await this.fallbackUserModel.findOne({ email }).exec();
      }
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
      let user;
      try {
        user = await this.primaryUserModel.findOne({ email }).select('+password').exec();
      } catch (error) {
        user = await this.fallbackUserModel.findOne({ email }).select('+password').exec();
      }
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
      let user;
      try {
        user = await this.primaryUserModel.findById(id).exec();
      } catch (error) {
        user = await this.fallbackUserModel.findById(id).exec();
      }
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

    let users;
    try {
      users = await this.primaryUserModel.find(filter).select('-password').lean().exec();
    } catch (error) {
      users = await this.fallbackUserModel.find(filter).select('-password').lean().exec();
    }

    return users
  
  } catch (error) {
    throw new InternalServerErrorException(`Failed to fetch users: ${error.message}`);
  }
}



  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<IUser> {
    let updatedUser;
    try {
      updatedUser = await this.primaryUserModel.findByIdAndUpdate(id, updateUserDto, { new: true });
      try {
        await this.fallbackUserModel.findByIdAndUpdate(id, updateUserDto, { new: true });
      } catch (fallbackError) {
        console.warn('Failed to sync update to fallback:', fallbackError.message);
      }
    } catch (primaryError) {
      updatedUser = await this.fallbackUserModel.findByIdAndUpdate(id, updateUserDto, { new: true });
    }
    if (!updatedUser) {
      throw new HttpException('User not found', 404);
    }
    return updatedUser;
  }

  async update(email: string, updateData: Partial<Users>): Promise<IUser> {
    try {
      let updatedUser;
      try {
        updatedUser = await this.primaryUserModel
          .findOneAndUpdate({ email }, updateData, { new: true })
          .exec();
        try {
          await this.fallbackUserModel.findOneAndUpdate({ email }, updateData, { new: true }).exec();
        } catch (fallbackError) {
          console.warn('Failed to sync update to fallback:', fallbackError.message);
        }
      } catch (primaryError) {
        updatedUser = await this.fallbackUserModel
          .findOneAndUpdate({ email }, updateData, { new: true })
          .exec();
      }
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
      let result;
      try {
        result = await this.primaryUserModel.findByIdAndDelete(id).exec();
        try {
          await this.fallbackUserModel.findByIdAndDelete(id).exec();
        } catch (fallbackError) {
          console.warn('Failed to sync delete to fallback:', fallbackError.message);
        }
      } catch (primaryError) {
        result = await this.fallbackUserModel.findByIdAndDelete(id).exec();
      }
      if (!result) {
        throw new HttpException('User not found', 404);
      }
      return 'User deleted';
    } catch (error) {
      throw new InternalServerErrorException(`Failed to delete user: ${error.message}`);
    }
  }

  async createUserFromProfile(createUserDto:CreateUserDto): Promise<IUser> {
    let existingUser;
    try {
      existingUser = await this.primaryUserModel.findOne({ email: createUserDto.email }).exec();
    } catch (error) {
      existingUser = await this.fallbackUserModel.findOne({ email: createUserDto.email }).exec();
    }
    
    if (existingUser) {
      throw new HttpException('User already exists', 400);
    }
    
    let newUser;
    try {
      newUser = await this.primaryUserModel.create(createUserDto);
      try {
        await this.fallbackUserModel.create({
          _id: newUser._id,
          ...createUserDto,
          createdAt: newUser.createdAt,
          updatedAt: newUser.updatedAt
        });
      } catch (fallbackError) {
        console.warn('Failed to sync user creation to fallback:', fallbackError.message);
      }
    } catch (primaryError) {
      newUser = await this.fallbackUserModel.create(createUserDto);
    }
    
    return newUser.populate({path:'createdBy',select:'-password'});
  }
  }
