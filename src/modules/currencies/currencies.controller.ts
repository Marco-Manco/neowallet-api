import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { CurrenciesService } from './currencies.service';
import { CreateCurrencyDto } from './dto/create-currency.dto';
import { UpdateCurrencyDto } from './dto/update-currency.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { CurrencyResponseDto } from './dto/currency-response.dto';

@ApiTags('Currencies')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('currencies')
export class CurrenciesController {
  constructor(private readonly currenciesService: CurrenciesService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new currency (Admin only)' })
  @ApiResponse({ status: 201, description: 'Currency successfully created', type: CurrencyResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden resource' })
  @ApiResponse({ status: 409, description: 'Currency code already exists' })
  create(@Body() createCurrencyDto: CreateCurrencyDto): Promise<CurrencyResponseDto> {
    return this.currenciesService.create(createCurrencyDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all active currencies' })
  @ApiResponse({ status: 200, description: 'List of currencies retrieved successfully', type: [CurrencyResponseDto] })
  findAll(): Promise<CurrencyResponseDto[]> {
    return this.currenciesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific currency by ID' })
  @ApiResponse({ status: 200, description: 'Currency retrieved successfully', type: CurrencyResponseDto })
  @ApiResponse({ status: 404, description: 'Currency not found' })
  findOne(@Param('id') id: string): Promise<CurrencyResponseDto> {
    return this.currenciesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a currency (Admin only)' })
  @ApiResponse({ status: 200, description: 'Currency successfully updated', type: CurrencyResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden resource' })
  @ApiResponse({ status: 404, description: 'Currency not found' })
  update(@Param('id') id: string, @Body() updateCurrencyDto: UpdateCurrencyDto): Promise<CurrencyResponseDto> {
    return this.currenciesService.update(id, updateCurrencyDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a currency (Admin only)' })
  @ApiResponse({ status: 204, description: 'Currency successfully deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden resource' })
  @ApiResponse({ status: 404, description: 'Currency not found' })
  remove(@Param('id') id: string): Promise<void> {
    return this.currenciesService.remove(id);
  }
}
