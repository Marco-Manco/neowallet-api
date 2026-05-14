import { DomainException } from './domain.exception';

export class WalletNotActiveException extends DomainException {
  readonly code = 'WALLET_NOT_ACTIVE';
  readonly statusCode = 400;

  constructor(message = 'Wallet is not active or has been deleted') {
    super(message);
  }
}
