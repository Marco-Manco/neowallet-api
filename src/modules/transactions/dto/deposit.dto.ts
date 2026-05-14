import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class DepositDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID('4', { message: 'Wallet ID must be a valid UUID' })
  @IsNotEmpty()
  walletId: string;

  @ApiProperty({ example: '100.50' })
  @IsString({ message: 'Amount must be a string' })
  @IsNotEmpty()
  amount: string;
}
