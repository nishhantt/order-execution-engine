import { logger } from './logger';
import { config } from '../config';

export interface RetryOptions {
  maxAttempts: number;
  backoffMs: number;
  onRetry?: (attempt: number, error: Error) => void;
}

export class RetryHandler {
  static async withExponentialBackoff<T>(
    fn: () => Promise<T>,
    context: string,
    options?: Partial<RetryOptions>
  ): Promise<T> {
    const opts: RetryOptions = {
      maxAttempts: options?.maxAttempts ?? config.orderProcessing.maxRetryAttempts,
      backoffMs: options?.backoffMs ?? config.orderProcessing.retryBackoffMs,
      onRetry: options?.onRetry,
    };

    let lastError: Error;

    for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        if (attempt === opts.maxAttempts) {
          logger.error(
            { context, attempt, error: lastError.message },
            'All retry attempts exhausted'
          );
          throw lastError;
        }

        const delayMs = opts.backoffMs * Math.pow(2, attempt - 1);

        logger.warn(
          { context, attempt, maxAttempts: opts.maxAttempts, delayMs, error: lastError.message },
          'Retrying after exponential backoff'
        );

        if (opts.onRetry) {
          opts.onRetry(attempt, lastError);
        }

        await this.sleep(delayMs);
      }
    }

    throw lastError!;
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}