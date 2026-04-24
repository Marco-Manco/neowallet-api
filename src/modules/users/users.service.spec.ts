import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { UserMapper } from 'src/commons/user.mapper';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { MockRepositoryFactory } from 'src/testing/mocks/repository.mock';
import { mockUser, mockUserResponse } from './test/user.fixture';
import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let repository: ReturnType<typeof MockRepositoryFactory>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        UserMapper,
        {
          provide: getRepositoryToken(User),
          useFactory: MockRepositoryFactory,
        }
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  })

  describe('findById', () => {
    it('should return a UserResponseDto when user is found', async () =>{
      repository.findOne.mockResolvedValue(mockUser);
      const result = await service.findById(mockUser.id);

      expect(repository.findOne).toHaveBeenCalledWith({where: {id: mockUser.id}});
      expect(result).toEqual(mockUserResponse);
      expect(result).not.toHaveProperty('passwordHash');
    })

    it('should throw NotFoundException when user is not found', async () =>{
      repository.findOne.mockResolvedValue(null);
      await expect(service.findById('uuid-invalido')).rejects.toThrow(NotFoundException);
    })
  })

  describe('create', () =>{
    const createUserDto = { email: 'new@example.com', password: 'password123' };

    it('should successfully create and return a user', async () => {
      repository.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password_123'); 
      repository.create.mockReturnValue(mockUser);
      repository.save.mockResolvedValue(mockUser);

      const result = await service.create(createUserDto);

      expect(repository.findOne).toHaveBeenCalledWith({ where: { email: createUserDto.email } });
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(repository.create).toHaveBeenCalledWith({
        email: createUserDto.email,
        passwordHash: 'hashed_password_123',
      });
      expect(repository.save).toHaveBeenCalled();
      expect(result).toEqual(mockUserResponse);
    });

    it('should throw ConflictException if email is already registered', async () => {
      repository.findOne.mockResolvedValue(mockUser);

      await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);
      await expect(service.create(createUserDto)).rejects.toThrow('Email is already registered');
      
      expect(repository.create).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
    });
  })

  describe('softDelete', () => {
    it('should successfully soft delete a user', async () => {
      repository.findOne.mockResolvedValue(mockUser);
      
      await service.softDelete(mockUser.id);

      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: mockUser.id } });
      expect(repository.softDelete).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw NotFoundException when trying to delete a non-existent user', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.softDelete('uuid-invalido')).rejects.toThrow(NotFoundException);
      expect(repository.softDelete).not.toHaveBeenCalled();
    });
  });

  describe('findByEmail', () => {
    it('should return a User when email exists', async () => {
      repository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail(mockUser.email);

      expect(repository.findOne).toHaveBeenCalledWith({ where: { email: mockUser.email } });
      expect(result).toEqual(mockUser); 
    });

    it('should return null when email does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('notfound@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return an array of UserResponseDto', async () => {
      repository.find.mockResolvedValue([mockUser]);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalled();
      expect(result).toEqual([mockUserResponse]);
      expect(Array.isArray(result)).toBe(true);
    });
  });

});
