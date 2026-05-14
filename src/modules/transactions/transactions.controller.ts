import { Controller, Post, Body, Get, Param, UseGuards, Headers } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { TransactionsService } from './transactions.service';
import { DepositDto } from './dto/deposit.dto';
import { WithdrawDto } from './dto/withdraw.dto';
import { TransferDto } from './dto/transfer.dto';
import { TransactionResponseDto, toTransactionResponseDto } from './dto/transaction-response.dto';
import { IdempotencyGuard } from './guards/idempotency.guard';

@ApiTags('Transactions')
@ApiBearerAuth()
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post('deposit')
  @UseGuards(AuthGuard('jwt'), IdempotencyGuard)
  @ApiOperation({ summary: 'Deposit funds into a wallet' })
  @ApiResponse({ status: 201, description: 'Deposit completed', type: TransactionResponseDto })
  @ApiHeader({ name: 'Idempotency-Key', required: false, description: 'Unique key to prevent duplicate deposits' })
  async deposit(
    @Body() dto: DepositDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<TransactionResponseDto> {
    return this.transactionsService.deposit(dto.walletId, dto.amount, idempotencyKey);
  }

  @Post('withdraw')
  @UseGuards(AuthGuard('jwt'), IdempotencyGuard)
  @ApiOperation({ summary: 'Withdraw funds from a wallet' })
  @ApiResponse({ status: 201, description: 'Withdrawal completed', type: TransactionResponseDto })
  @ApiHeader({ name: 'Idempotency-Key', required: false, description: 'Unique key to prevent duplicate withdrawals' })
  async withdraw(
    @Body() dto: WithdrawDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<TransactionResponseDto> {
    return this.transactionsService.withdraw(dto.walletId, dto.amount, idempotencyKey);
  }

  @Post('transfer')
  @UseGuards(AuthGuard('jwt'), IdempotencyGuard)
  @ApiOperation({ summary: 'Transfer funds between wallets' })
  @ApiResponse({ status: 201, description: 'Transfer completed', type: TransactionResponseDto })
  @ApiHeader({ name: 'Idempotency-Key', required: false, description: 'Unique key to prevent duplicate transfers' })
  async transfer(
    @Body() dto: TransferDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<TransactionResponseDto> {
    return this.transactionsService.transfer(
      dto.sourceWalletId,
      dto.targetWalletId,
      dto.amount,
      idempotencyKey,
    );
  }

  @Get('wallet/:walletId')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get transactions for a specific wallet' })
  @ApiResponse({ status: 200, description: 'List of transactions', type: [TransactionResponseDto] })
  async findByWallet(@Param('walletId') walletId: string): Promise<TransactionResponseDto[]> {
    const transactions = await this.transactionsService.findByWalletId(walletId);
    return transactions.map((t) => toTransactionResponseDto(t));
  }
}
