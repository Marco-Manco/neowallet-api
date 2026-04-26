import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UserMapper } from 'src/modules/users/mappers/user.mapper';
import { UserResponseDto } from '../users/dto/user-response.dto';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { RegisterUserUseCase } from './use-cases/register-user.user-case';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly userMapper: UserMapper,
        private readonly registerUserUseCase: RegisterUserUseCase,
    ){}

    async validateUser(email: string, pass: string): Promise<UserResponseDto | null>{
        const user = await this.usersService.findByEmail(email);
        if(user && await bcrypt.compare(pass, user.passwordHash)){
            return this.userMapper.toResponseDto(user);
        }
        return null;
    }

    async login(user: UserResponseDto){
        const payload = {
            email: user.email,
            sub: user.id,
            role: user.role,
        }

        return {
            access_token: this.jwtService.sign(payload)
        }
    }

    async register(createUserDto: CreateUserDto) {
        const newUser = await this.registerUserUseCase.execute(createUserDto);
        const tokenData = await this.login(newUser);

        return {
            user: newUser,
            access_token: tokenData.access_token
        };
    }
    
}
