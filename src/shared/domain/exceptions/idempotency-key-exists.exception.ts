import { DomainException } from './domain.exception';

export class IdempotencyKeyExistsException extends DomainException {
  readonly code = 'IDEMPOTENCY_KEY_EXISTS';
  readonly statusCode = 409;

  constructor(message = 'Idempotency key has already been used') {
    super(message);
  }
}
