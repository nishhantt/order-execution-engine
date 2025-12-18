import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export const errorHandler = (
  error: FastifyError | AppError | Error,
  request: FastifyRequest,
  reply: FastifyReply
) => {
  // Log the error
  logger.error(
    {
      error: error.message,
      stack: error.stack,
      url: request.url,
      method: request.method,
    },
    'Request error'
  );

  // Handle known operational errors
  if (error instanceof AppError && error.isOperational) {
    return reply.status(error.statusCode).send({
      error: error.name,
      message: error.message,
      statusCode: error.statusCode,
    });
  }

  // Handle validation errors from Fastify
  if ('validation' in error && error.validation) {
    return reply.status(400).send({
      error: 'ValidationError',
      message: 'Invalid request data',
      details: error.validation,
      statusCode: 400,
    });
  }

  // Handle unknown errors
  const statusCode = (error as any).statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message;

  return reply.status(statusCode).send({
    error: 'InternalServerError',
    message,
    statusCode,
  });
};