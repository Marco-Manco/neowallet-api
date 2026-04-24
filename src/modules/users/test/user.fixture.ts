import { UserResponseDto } from "../dto/user-response.dto";
import { User } from "../entities/user.entity";
import { UserRole } from "../enums/user-role.enum";

export const mockUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    passwordHash: 'hasshed_password_123',
    role: UserRole.USER,
    createdAt: new Date('2026-04-23T10:00:00Z'),
    updatedAt: new Date('2026-04-23T10:00:00Z'),
}

export const mockUserResponse: UserResponseDto = {
    id: mockUser.id,
    email: mockUser.email,
    role: mockUser.role,
    createdAt: mockUser.createdAt,
    updatedAt: mockUser.updatedAt,
}