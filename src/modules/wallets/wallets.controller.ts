import { Controller, Get, Post, Body, Param, Delete, UseGuards, HttpCode, HttpStatus, ParseUUIDPipe } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { WalletResponseDto } from './dto/wallet-response.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Wallets')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new wallet' })
  create(
    @GetUser() user: JwtPayload,
    @Body() createWalletDto: CreateWalletDto,
  ): Promise<WalletResponseDto> {
    return this.walletsService.create(user.sub, createWalletDto.currencyCode);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all wallets (Admin only)' })
  findAll(): Promise<WalletResponseDto[]> {
    return this.walletsService.findAll();
  }

  @Get('me')
  @ApiOperation({ summary: 'Get my wallets' })
  findMyWallets(@GetUser() user: JwtPayload): Promise<WalletResponseDto[]> {
    return this.walletsService.findByUserId(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific wallet' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: JwtPayload,
  ): Promise<WalletResponseDto> {
    return this.walletsService.findOne(id, user.sub, user.role);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a wallet' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: JwtPayload,
  ): Promise<void> {
    return this.walletsService.remove(id, user.sub, user.role);
  }
}