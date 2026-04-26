import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport'
import { JwtModule, JwtSignOptions } from '@nestjs/jwt'
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { WalletsModule } from '../wallets/wallets.module';
import { RegisterUserUseCase } from './use-cases/register-user.user-case';
@Module({
  imports: [
    UsersModule,
    PassportModule,
    WalletsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule, UsersModule, WalletsModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: (configService.get<string>('JWT_EXPIRES_IN') || '1h') as JwtSignOptions['expiresIn'],
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy, RegisterUserUseCase],
  exports: [JwtModule],
})
export class AuthModule {}
