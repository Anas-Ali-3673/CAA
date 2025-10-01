import { CreateUserDto } from "../../users/dto/createUser.dto";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';

export class signUpDto {
    @ApiProperty({
        description: 'User\'s email address',
        example: 'john.doe@example.com',
        format: 'email',
    })
    @IsEmail()
    @IsNotEmpty()
    email:string

    @ApiProperty({
        description: 'User\'s password',
        example: 'SecurePassword123!',
        minLength: 6,
        format: 'password',
    })
    @IsNotEmpty()
    @IsString()
    password:string
}