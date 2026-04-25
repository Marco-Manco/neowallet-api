import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUppercase, Max, Min } from "class-validator";
import { CurrencyType } from "../enums/currency-type.enum";

export class CreateCurrencyDto {
  @ApiProperty({ example: 'USDT', description: 'The unique code for the currency' })
  @IsString()
  @IsNotEmpty()
  @IsUppercase()
  code: string;

  @ApiProperty({ example: 'Tether US', description: 'The full name of the currency' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: '₮', description: 'The currency symbol' })
  @IsString()
  @IsOptional()
  symbol?: string;

  @ApiProperty({ enum: CurrencyType, example: CurrencyType.CRYPTO })
  @IsEnum(CurrencyType)
  type: CurrencyType;

  @ApiProperty({ example: 6, description: 'Maximum decimal places allowed', default: 2 })
  @IsInt()
  @Min(0)
  @Max(18)
  @IsOptional()
  decimals?: number = 2;
}
