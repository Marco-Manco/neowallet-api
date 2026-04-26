import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateWalletDto {
  @ApiProperty({
    description: 'Currency code',
    example: 'BTC',
  })
  @IsString()
  @IsNotEmpty()
  currencyCode: string;
}