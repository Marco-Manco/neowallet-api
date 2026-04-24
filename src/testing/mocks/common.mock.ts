export const MockJwtServiceFactory = jest.fn(() => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));

export const MockUserMapperFactory = jest.fn(() => ({
  toResponseDto: jest.fn(),
}));