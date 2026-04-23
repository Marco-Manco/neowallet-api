import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-local";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { UserResponseDto } from "src/modules/users/dto/user-response.dto";
import { AuthService } from "../auth.service";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy){
    constructor(private authService: AuthService){
        super({usernameField: 'email'}) ;
    }

    async validate(email: string, pass: string): Promise<UserResponseDto>{
        const user = await this.authService.validateUser(email, pass);
        if(!user) throw new UnauthorizedException('Invalid credentials');
        
        return user;
    }
}