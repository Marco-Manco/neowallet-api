import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UserMapper } from 'src/commons/user.mapper';
import { UserResponseDto } from '../users/dto/user-response.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly userMapper: UserMapper,
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
}
