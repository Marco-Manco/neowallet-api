export const MockUsersServiceFactory = jest.fn(() => ({
  findByEmail: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  findAll: jest.fn(),
  softDelete: jest.fn(),
}));