import { UserResponseDto } from "src/modules/users/dto/user-response.dto";
import { User } from "src/modules/users/entities/user.entity";

export class UserMapper{
    toResponseDto(user: User): UserResponseDto{
        const dto = new UserResponseDto();
        dto.id = user.id;
        dto.email = user.email;
        dto.createdAt = user.createdAt;
        return dto;
    }
}