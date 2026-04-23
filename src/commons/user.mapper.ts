import { Injectable } from "@nestjs/common";
import { UserResponseDto } from "src/modules/users/dto/user-response.dto";
import { User } from "src/modules/users/entities/user.entity";

@Injectable()
export class UserMapper{
    toResponseDto(user: User): UserResponseDto{
        const dto = new UserResponseDto();
        dto.id = user.id;
        dto.email = user.email;
        dto.role = user.role;
        dto.createdAt = user.createdAt;
        return dto;
    }

    toResponseDtoList(users: User[]): UserResponseDto[]{
        return users.map(user => this.toResponseDto(user));
    }
}