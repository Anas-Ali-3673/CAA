import { HttpException, HttpStatus, Injectable,  } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { IAuth } from './interfaces/auth.interfaces';
import { IUser } from 'src/users/interfaces/users.interface';
import { signInDto } from './dto/signIn.dto';
import * as bcrypt from 'bcrypt';
import { InjectModel } from '@nestjs/mongoose';
import { Users } from 'src/users/schema/users.schema';
import { Model } from 'mongoose';
import { signUpDto } from './dto/signUp.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AuthService {

  constructor(
    @InjectModel(Users.name) private userModel: Model<IUser>,
    private readonly usersService: UsersService,
     private readonly jwtService: JwtService,
     private readonly auditService: AuditService,   
  ) {}

  async signUp(signUpDto: signUpDto): Promise<Omit<IUser, "password">> {
    const user = await this.usersService.createUser(signUpDto);
    if (!user) {
          throw new HttpException(
            {
              status: HttpStatus.BAD_REQUEST,
              message: 'User already exists',
            },
            HttpStatus.BAD_REQUEST,
          );
        }

    await this.auditService.log(user._id, 'user', 'SIGNUP', 'user', user._id, { email: signUpDto.email });
     return user;
  }

  async signIn(signInDto: signInDto): Promise<IAuth> {
    const user = await this.usersService.findByEmail(
      signInDto.email.toLowerCase(),
    );
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const userWithPassword = await this.usersService.findByEmailWithPassword(
      signInDto.email.toLowerCase(),
    );
    if (!userWithPassword) {
      throw new Error('Invalid credentials');
    }
    const isMatch = await bcrypt.compare(
      signInDto.password,
      userWithPassword.password || '',
    );
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }
    const payload = { name: user.name || user.email, _id: user._id, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload);
    
    await this.auditService.log(user._id, user.role, 'LOGIN', 'user', user._id, { email: signInDto.email });
    
    return {
      ...user,
      accessToken,
    };
  }
}


