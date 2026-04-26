import { Controller, Post, Body, UseGuards, Get, Delete, HttpCode, HttpStatus, Param} from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserResponseDto } from './dto/user-response.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from './enums/user-role.enum';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({summary: 'Get current user profile'})
  @ApiResponse({
    status: 200,
    description: 'Current user profile retrieved successfully',
    type: UserResponseDto
  })
  @ApiResponse({status: 401, description: 'Unauthorized'})
  getProfile(@GetUser() user: JwtPayload): Promise<UserResponseDto>{
    return this.usersService.findById(user.sub);
  }
  
  @Delete('me')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({summary: 'Soft delete current user account'})
  @ApiResponse({status: 204, description: 'Account successfully deleted'})
  @ApiResponse({status: 401, description: 'Unauthorized'})
  deleteMyAccount(@GetUser() user: JwtPayload): Promise<void>{  
    return this.usersService.softDelete(user.sub);
  }
  
  
  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({summary: 'Find all users, must have role admin'})
  @ApiResponse({status: 200, description: 'Users list retrieved succesfully'})
  @ApiResponse({status: 403, description: 'Forbidden resource'})
  findAdll(){
    return this.usersService.findAll();
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete any user account (Admin only)' })
  @ApiResponse({ status: 204, description: 'User account successfully deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden resource' })
  @ApiResponse({ status: 404, description: 'User not found' })
  deleteUser(@Param('id') id: string): Promise<void> {
    return this.usersService.softDelete(id);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Find a specific user by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully', type: UserResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden resource' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOneUser(@Param('id') id: string): Promise<UserResponseDto> {
    return this.usersService.findById(id);
  }
  
}
