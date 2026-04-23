import { Controller, Post, Body, UseGuards, Get} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserResponseDto } from './dto/user-response.dto';
import { Roles } from '../auth/roles.decorator';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from './enums/user-role.enum';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({summary: 'Register a new user'})
  @ApiResponse({
    status: 201,
    description: 'The user has been succesfully created',
    type: UserResponseDto
  })
  create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({summary: 'Find all users, must haver role admin'})
  @ApiResponse({
    status: 200,
    description: 'Users list'
  })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  findAdll(){
    return this.usersService.findAll();
  }
}
