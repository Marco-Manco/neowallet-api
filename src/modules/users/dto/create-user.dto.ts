import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MaxLength, MinLength } from 'class-validator';

export class CreateUserDto {
    @ApiProperty({
        example: 'jhon.doe@neowallet.com',
        description: 'The email address of the user'
    })
    @IsEmail({}, {message: 'Invalid email format'})
    @IsNotEmpty({message: 'Email is required'})
    email: string;

    @ApiProperty({
        example: 'Strong@passw0rd',
        description: 'The password for the account',
        minLength: 8,
        maxLength: 32
    })
    @IsNotEmpty({message: 'Password is required'})
    @MinLength(8, {message: 'Password must be at least 8 characters long'})
    @MaxLength(32, {message: 'Password cannot exceed 32 characters'})
    password: string;
}
