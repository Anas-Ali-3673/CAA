import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('No authorization');
    }

    const [, accessToken] = authHeader.split(' ');

    try {
      const payload = await this.jwtService.verifyAsync(accessToken);

      // If the payload does not contain the expected properties, throw an error
      if (!payload || typeof payload !== 'object' || !payload._id) {
        throw new UnauthorizedException('Invalid accessToken payload');
      }

      request['user'] = payload;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired accessToken');
    }
  }
}