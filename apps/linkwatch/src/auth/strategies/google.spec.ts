import { Test, TestingModule } from '@nestjs/testing';
import { Google } from './google';

describe('Google', () => {
  let provider: Google;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Google],
    }).compile();

    provider = module.get<Google>(Google);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
