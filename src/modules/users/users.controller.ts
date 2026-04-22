import { Controller, Post, Body} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserResponseDto } from './dto/user-response.dto';

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
}
