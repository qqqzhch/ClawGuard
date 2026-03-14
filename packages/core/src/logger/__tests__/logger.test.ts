import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import pino from 'pino';
import { logger, logInfo, logWarn, logError, logDebug, logSuccess } from '../logger.js';

vi.mock('pino', () => ({
  default: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  })),
}));

describe('Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should log info message', () => {
    logInfo('Test message');
    expect(logger.info).toHaveBeenCalled();
  });

  it('should log warn message', () => {
    logWarn('Warning message');
    expect(logger.warn).toHaveBeenCalled();
  });

  it('should log error with error object', () => {
    const error = new Error('Test error');
    logError('Error message', error);
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Test error' }),
      'Error message'
    );
  });

  it('should log debug message', () => {
    logDebug('Debug message');
    expect(logger.debug).toHaveBeenCalled();
  });

  it('should log success message', () => {
    logSuccess('Success message');
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ success: true }),
      'Success message'
    );
  });

  it('should include context in log', () => {
    const context = { command: 'backup', backupId: '123' };
    logInfo('Backup started', context);
    expect(logger.info).toHaveBeenCalledWith(context, 'Backup started');
  });
});
