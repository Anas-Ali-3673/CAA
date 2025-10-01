import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDTO {
  @ApiProperty({ example: '1234' })
  @IsString()
  otp: string;
@ApiProperty({ example: 'test@gmail.com' })
  @IsString()
  email: string;
}