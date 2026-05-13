import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { DolarApiProvider } from './providers/dolar-api.provider';
import { PriceProviderFactory } from './price-provider.factory';
import { CryptoProvider } from './providers/crypto.provider';

@Module({
  imports: [
    HttpModule,     // Para hacer las peticiones HTTP
    ConfigModule    // Para leer el .env
  ],
  providers: [
    DolarApiProvider,
    CryptoProvider,
    PriceProviderFactory,
  ],
  exports: [PriceProviderFactory],
})
export class PriceProviderModule {}