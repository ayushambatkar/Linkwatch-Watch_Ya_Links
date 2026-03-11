import { Test, TestingModule } from '@nestjs/testing';
import { AuthRepository } from './auth.repository';

describe('AuthRepository', () => {
  let provider: AuthRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthRepository],
    }).compile();

    provider = module.get<AuthRepository>(AuthRepository);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
