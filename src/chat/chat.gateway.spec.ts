import { Test, TestingModule } from '@nestjs/testing';
import { ChatGateway } from './chat.gateway';

describe('ChatGateway', () => {
  let gateway: ChatGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChatGateway],
    }).compile();

    gateway = module.get<ChatGateway>(ChatGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  it('should handle ping and return pong', () => {
    const mockClient = {
      id: 'test-client-id',
      emit: jest.fn(),
    } as any;

    const result = gateway.handlePing(mockClient);
    
    expect(result).toBeDefined();
    expect(result.event).toBe('pong');
    expect(result.data.message).toBe('pong');
  });
});

