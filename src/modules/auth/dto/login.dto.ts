import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";

export class LoginDto{
    @ApiProperty({example: 'admin@newowallet.com'})
    @IsEmail({}, {message: 'Email must be valid'})
    @IsNotEmpty() 
    email: string;


    @ApiProperty({example: 'Password123!'})
    @IsString()
    @IsNotEmpty()
    @MinLength(8, {message: 'Password must be at least 8 characters long'})
    @MaxLength(32, {message: 'Password cannot exceed 32 characters'})
    password: string;
}