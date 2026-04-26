export const MockRepositoryFactory = jest.fn(() => ({
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    softDelete: jest.fn(),
    softRemove: jest.fn(),
}));