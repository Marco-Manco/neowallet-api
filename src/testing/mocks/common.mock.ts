export const MockJwtServiceFactory = jest.fn(() => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));

export const MockUserMapperFactory = jest.fn(() => ({
  toResponseDto: jest.fn(),
}));

export const MockRegisterUserUseCaseFactory = jest.fn(() => ({
  execute: jest.fn(),
}));

export const MockWalletMapperFactory = jest.fn(() => ({
  toResponseDto: jest.fn(),
  toResponseDtoArray: jest.fn(),
}));