import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UserMapper } from 'src/modules/users/mappers/user.mapper';
import { mockUser, mockUserResponse } from '../users/test/user.fixture';
import { MockUsersServiceFactory } from 'src/testing/mocks/services.mock';
import { MockJwtServiceFactory, MockRegisterUserUseCaseFactory, MockUserMapperFactory } from 'src/testing/mocks/common.mock';
import * as bcrypt from 'bcrypt';
import { RegisterUserUseCase } from './use-cases/register-user.user-case';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: ReturnType<typeof MockUsersServiceFactory>;
  let jwtService: ReturnType<typeof MockJwtServiceFactory>;
  let userMapper: ReturnType<typeof MockUserMapperFactory>;
  let registerUserUseCase: ReturnType<typeof MockRegisterUserUseCaseFactory>; 

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useFactory: MockUsersServiceFactory },
        { provide: JwtService, useFactory: MockJwtServiceFactory },
        { provide: UserMapper, useFactory: MockUserMapperFactory },
        { provide: RegisterUserUseCase, useFactory: MockRegisterUserUseCaseFactory}
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    userMapper = module.get(UserMapper);
    registerUserUseCase = module.get(RegisterUserUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    const plainPassword = 'password123';

    it('should return user profile if credentials are valid', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      userMapper.toResponseDto.mockReturnValue(mockUserResponse);

      const result = await service.validateUser(mockUser.email, plainPassword);

      expect(usersService.findByEmail).toHaveBeenCalledWith(mockUser.email);
      expect(result).toEqual(mockUserResponse);
    });

    it('should return null if user does not exist', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser('notfound@test.com', plainPassword);

      expect(result).toBeNull();
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should return null if password is wrong', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser(mockUser.email, 'wrong_pass');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should sign a JWT token for the user', async () => {
      const mockToken = 'mocked_jwt_token';
      jwtService.sign.mockReturnValue(mockToken);

      const result = await service.login(mockUserResponse);

      expect(jwtService.sign).toHaveBeenCalled();
      expect(result).toEqual({ access_token: mockToken });
    });
  });


  describe('register', () => {
    it('should register a user and return the user profile with an access token', async () => {
      const createUserDto = { email: 'test@domain.com', password: 'password123' };
      const mockToken = 'mocked_jwt_token';

      registerUserUseCase.execute.mockResolvedValue(mockUserResponse);
      jwtService.sign.mockReturnValue(mockToken);

      const result = await service.register(createUserDto);

      expect(registerUserUseCase.execute).toHaveBeenCalledWith(createUserDto);
      
      expect(result).toEqual({
        user: mockUserResponse,
        access_token: mockToken,
      });
    });
  });
});