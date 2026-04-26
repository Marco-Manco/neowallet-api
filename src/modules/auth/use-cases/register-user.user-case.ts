import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UsersService } from '../../users/users.service';
import { WalletsService } from '../../wallets/wallets.service';
import { CreateUserDto } from '../../users/dto/create-user.dto';
import { UserResponseDto } from '../../users/dto/user-response.dto';

@Injectable()
export class RegisterUserUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly usersService: UsersService,
    private readonly walletsService: WalletsService,
  ) {}

  async execute(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const newUser = await this.usersService.create(
        createUserDto, 
        queryRunner.manager
      );

      const defaultCurrencyCode = 'ARS';
      await this.walletsService.create(
        newUser.id, 
        defaultCurrencyCode, 
        queryRunner.manager
      );

      await queryRunner.commitTransaction();

      return newUser;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error; 

    } finally {
      await queryRunner.release();
    }
  }
}