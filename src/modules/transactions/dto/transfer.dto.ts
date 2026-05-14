import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class TransferDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID('4', { message: 'Source wallet ID must be a valid UUID' })
  @IsNotEmpty()
  sourceWalletId: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsUUID('4', { message: 'Target wallet ID must be a valid UUID' })
  @IsNotEmpty()
  targetWalletId: string;

  @ApiProperty({ example: '25.00' })
  @IsString({ message: 'Amount must be a string' })
  @IsNotEmpty()
  amount: string;
}
