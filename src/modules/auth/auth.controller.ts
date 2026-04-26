import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
    ){}

    @ApiOperation({summary: 'Log in to the app'})
    @ApiBody({type: LoginDto})
    @Post('login')
    @UseGuards(AuthGuard('local'))
    async login(@Request() req, @Body() loginDto: LoginDto){
        return this.authService.login(req.user);
    }

    @Post('register')
    @ApiOperation({summary: 'Register a new user with a default ARS wallet'})
    @ApiResponse({
      status: 201,
      description: 'The user and their default wallet have been successfully created',
      type: UserResponseDto
    })
    register(@Body() createUserDto: CreateUserDto): Promise<{user: UserResponseDto, access_token: string}> {
      return this.authService.register(createUserDto);
    }
}
