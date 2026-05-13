import { DomainException } from './domain.exception';

export class PriceUnavailableException extends DomainException {
  readonly code = 'PRICE_UNAVAILABLE';
  readonly statusCode = 503;

  constructor(pair: string) {
    super(`Exchange rate unavailable for currency pair: ${pair}`);
  }
}
