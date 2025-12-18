export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, true);
  }
}

export class OrderNotFoundError extends AppError {
  constructor(orderId: string) {
    super(`Order not found: ${orderId}`, 404, true);
  }
}

export class DexQuoteError extends AppError {
  constructor(dex: string, message: string) {
    super(`${dex} quote failed: ${message}`, 500, true);
  }
}

export class SwapExecutionError extends AppError {
  constructor(message: string) {
    super(`Swap execution failed: ${message}`, 500, true);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, true);
  }
}