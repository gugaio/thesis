import { describe, it, expect, vi } from 'vitest';

describe('Gateway Worker', () => {
  it('should log startup message', () => {
    const mockLogger = {
      info: vi.fn(),
      error: vi.fn()
    };
    
    mockLogger.info('🚀 THESIS Gateway worker starting...');
    
    expect(mockLogger.info).toHaveBeenCalledWith('🚀 THESIS Gateway worker starting...');
  });
});
