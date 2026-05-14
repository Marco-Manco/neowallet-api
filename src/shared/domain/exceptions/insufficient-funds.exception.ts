import { DomainException } from './domain.exception';

export class InsufficientFundsException extends DomainException {
  readonly code = 'INSUFFICIENT_FUNDS';
  readonly statusCode = 400;

  constructor(message = 'Insufficient funds for this transaction') {
    super(message);
  }
}
