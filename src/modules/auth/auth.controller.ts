import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService){}

    @ApiOperation({summary: 'Log in to the app'})
    @ApiBody({type: LoginDto})
    @Post('login')
    @UseGuards(AuthGuard('local'))
    async login(@Request() req, @Body() loginDto: LoginDto){
        return this.authService.login(req.user);
    }
}
