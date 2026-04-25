import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm'
import { UserResponseDto } from './dto/user-response.dto';
import * as bcrypt from 'bcrypt';
import { UserMapper } from 'src/modules/users/mappers/user.mapper';

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

  async findById(id: string): Promise<UserResponseDto>{
    const user = await this.findUserOrThrow(id);
    return this.userMapper.toResponseDto(user);
  }

  async softDelete(id: string): Promise<void>{
    await this.findUserOrThrow(id);
    await this.userRepository.softDelete(id);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  private async validateEmailUniqueness(email: string): Promise<void>{
    const user = await this.findByEmail(email);
    if(user) throw new ConflictException('Email is already registered');
  }

  private async findUserOrThrow(id: string): Promise<User>{
    const user = await this.userRepository.findOne({where: {id}});
      if(!user) throw new NotFoundException('User not found');
      return user;
  }

  private hashPassword(password: string): Promise<string>{
    const salRounds = 10;
    return bcrypt.hash(password, salRounds);
  }
}
