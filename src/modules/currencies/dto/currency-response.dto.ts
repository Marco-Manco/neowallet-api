import { ApiProperty } from '@nestjs/swagger';
import { CurrencyType } from '../enums/currency-type.enum';

export class CurrencyResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'ARS' })
  code: string;

  @ApiProperty({ example: 'Argentine Peso' })
  name: string;

  @ApiProperty({ example: '$', nullable: true })
  symbol: string | null;

  @ApiProperty({ enum: CurrencyType })
  type: CurrencyType;

  @ApiProperty({ example: 2 })
  decimals: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}