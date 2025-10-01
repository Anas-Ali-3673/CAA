import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';

export class signInDto{
    @ApiProperty({
        description: 'User\'s email address for authentication',
        example: 'john.doe@example.com',
        format: 'email',
    })
    @IsString()
    @IsEmail()
    @IsNotEmpty()
    email:string;

    @ApiProperty({
        description: 'User\'s password for authentication',
        example: 'SecurePassword123!',
        minLength: 6,
        format: 'password',
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password:string;

    @ApiProperty({
        description: 'User\'s Firebase Cloud Messaging token',
        example: 'fcmToken',
        required: false,
    })
    @IsOptional()
    @IsString()
    fcmToken?: string;
}