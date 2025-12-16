import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  it('should be defined', () => {
    expect(new JwtStrategy()).toBeDefined();
  });

  it('should validate payload correctly', async () => {
    const strategy = new JwtStrategy();
    const payload = {
      sub: 'user-id',
      email: 'test@example.com',
      username: 'testuser',
    };

    const result = await strategy.validate(payload);

    expect(result).toEqual({
      userId: 'user-id',
      email: 'test@example.com',
      username: 'testuser',
    });
  });
});

