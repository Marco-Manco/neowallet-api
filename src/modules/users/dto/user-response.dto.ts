import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../enums/user-role.enum';

export class UserResponseDto {
    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
    id: string;

    @ApiProperty({ example: 'user@example.com' })
    email: string;

    @ApiProperty({enum: UserRole, example: UserRole.USER})
    role: UserRole;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt?: Date;
    
}
