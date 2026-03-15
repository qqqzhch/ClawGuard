import { logger } from '../utils/logger.js';

export interface GatewayCommandOptions {
  port?: number;
}

export async function handleGatewayCommand(
  action: 'start' | 'status',
  options: GatewayCommandOptions = {}
): Promise<void> {
  switch (action) {
    case 'start':
      await startGateway(options);
      break;
    case 'status':
      await checkGatewayStatus();
      break;
  }
}

async function startGateway(options: GatewayCommandOptions): Promise<void> {
  try {
    const port = options.port || 3000;
    logger.info(`Starting Gateway on port ${port}...`);

    // Import and start gateway directly
    const { startServer } = await import('@gateway/clawguard');
    startServer(port);
    logger.info(`✅ Gateway running at http://localhost:${port}`);
  } catch (error) {
    logger.error('Failed to start Gateway', error as Error);
    throw error;
  }
}

async function checkGatewayStatus(): Promise<void> {
  try {
    // Check if gateway process is running
    // For simplicity, just check if port is in use
    const result = await fetch('http://localhost:3000/api/').catch(() => null);

    if (result) {
      logger.success('Gateway is running at http://localhost:3000');
    } else {
      logger.warn('Gateway is not running');
    }
  } catch (error) {
    logger.warn('Failed to check Gateway status', error as Error);
  }
}
