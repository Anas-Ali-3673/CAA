import { Body, Controller, Post, UseGuards, Req, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { IAuth } from './interfaces/auth.interfaces';
import { signInDto } from './dto/signIn.dto';
import { signUpDto } from './dto/signUp.dto';
import { IUser } from 'src/users/interfaces/users.interface';
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  
  @Post('signup')
  async signUp(
    @Body() signUpDto: signUpDto,
  ): Promise<Omit<IUser, 'password'>>{
    return this.authService.signUp(signUpDto);
  }

  @Post('signin')
  async signIn(@Body() signInDto: signInDto): Promise<IAuth> {
    return this.authService.signIn(signInDto);
  }

 
}

