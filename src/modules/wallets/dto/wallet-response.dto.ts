import { ApiProperty } from '@nestjs/swagger';
import { CurrencyResponseDto } from '../../currencies/dto/currency-response.dto'; 

export class WalletResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '0.00000000', description: 'Wallet balance' })
  balance: string;

  @ApiProperty({ type: () => CurrencyResponseDto })
  currency: CurrencyResponseDto;

  @ApiProperty({ example: 'a1b2c3d4-e89b-12d3-a456-426614174111' })
  userId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}