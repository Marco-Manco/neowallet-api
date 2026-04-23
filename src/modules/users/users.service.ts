import { ConflictException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm'
import { UserMapper } from 'src/commons/user.mapper';
import { UserResponseDto } from './dto/user-response.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly userMapper: UserMapper,
  ){}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const {email, password} = createUserDto;
    await this.validateEmailUniqueness(email);
    const passwordHash = await this.hashPassword(password);

    const newUser = this.userRepository.create({
      email,
      passwordHash,
    })

    const savedUser = await this.userRepository.save(newUser);

    return this.userMapper.toResponseDto(savedUser);
  }

  async findAll(): Promise<UserResponseDto[]>{
    const users =  await this.userRepository.find();
    return this.userMapper.toResponseDtoList(users);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  private async validateEmailUniqueness(email: string): Promise<void>{
    const user = await this.findByEmail(email);
    if(user) throw new ConflictException('Email is already registered');
  }

  private hashPassword(password: string): Promise<string>{
    const salRounds = 10;
    return bcrypt.hash(password, salRounds);
  }
}
