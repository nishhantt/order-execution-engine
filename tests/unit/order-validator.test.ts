import { OrderValidator } from '../../src/services/order-processor/validator';
import { OrderType } from '../../src/types/order.types';
import { ValidationError } from '../../src/utils/errors';

describe('OrderValidator', () => {
  let validator: OrderValidator;

  beforeEach(() => {
    validator = new OrderValidator();
  });

  it('should validate a correct market order', () => {
    const input = {
      orderType: 'market',
      tokenIn: 'SOL',
      tokenOut: 'USDC',
      amountIn: 100,
    };

    const result = validator.validate(input);

    expect(result.orderType).toBe(OrderType.MARKET);
    expect(result.tokenIn).toBe('SOL');
    expect(result.tokenOut).toBe('USDC');
    expect(result.amountIn).toBe(100);
  });

  it('should reject when tokenIn and tokenOut are the same', () => {
    const input = {
      orderType: 'market',
      tokenIn: 'SOL',
      tokenOut: 'SOL',
      amountIn: 100,
    };

    expect(() => validator.validate(input)).toThrow(ValidationError);
    expect(() => validator.validate(input)).toThrow('tokenIn and tokenOut must be different');
  });

  it('should reject negative amountIn', () => {
    const input = {
      orderType: 'market',
      tokenIn: 'SOL',
      tokenOut: 'USDC',
      amountIn: -100,
    };

    expect(() => validator.validate(input)).toThrow(ValidationError);
  });

  it('should reject zero amountIn', () => {
    const input = {
      orderType: 'market',
      tokenIn: 'SOL',
      tokenOut: 'USDC',
      amountIn: 0,
    };

    expect(() => validator.validate(input)).toThrow(ValidationError);
  });

  it('should reject amountIn that is too small', () => {
    const input = {
      orderType: 'market',
      tokenIn: 'SOL',
      tokenOut: 'USDC',
      amountIn: 0.0000001,
    };

    expect(() => validator.validate(input)).toThrow(ValidationError);
    expect(() => validator.validate(input)).toThrow('amountIn is too small');
  });

  it('should reject missing required fields', () => {
    const input = {
      orderType: 'market',
      tokenIn: 'SOL',
      // missing tokenOut and amountIn
    };

    expect(() => validator.validate(input)).toThrow(ValidationError);
  });

  it('should reject invalid orderType', () => {
    const input = {
      orderType: 'invalid',
      tokenIn: 'SOL',
      tokenOut: 'USDC',
      amountIn: 100,
    };

    expect(() => validator.validate(input)).toThrow(ValidationError);
  });

  it('should accept all valid order types', () => {
    const types = ['market', 'limit', 'sniper'];

    types.forEach((type) => {
      const input = {
        orderType: type,
        tokenIn: 'SOL',
        tokenOut: 'USDC',
        amountIn: 100,
      };

      expect(() => validator.validate(input)).not.toThrow();
    });
  });
});