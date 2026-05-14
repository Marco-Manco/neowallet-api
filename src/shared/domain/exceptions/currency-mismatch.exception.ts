import { DomainException } from './domain.exception';

export class CurrencyMismatchException extends DomainException {
  readonly code = 'CURRENCY_MISMATCH';
  readonly statusCode = 400;

  constructor(message = 'Source and target wallets must have the same currency') {
    super(message);
  }
}
