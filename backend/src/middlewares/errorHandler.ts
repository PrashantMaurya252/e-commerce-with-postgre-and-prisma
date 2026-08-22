// middlewares/errorHandler.ts
import { NextFunction, Response } from 'express';
import logger from '../utils/logger.js';
import { AuthRequest } from './auth.js';
import { ApiError } from '../utils/responseHandler.js';



const SENSITIVE_FIELDS = ['password', 'confirmPassword', 'token', 'otp', 'cardNumber'];

function redactBody(body: any) {
  if (!body || typeof body !== 'object') return body;
  const clone = { ...body };
  for (const key of SENSITIVE_FIELDS) {
    if (key in clone) clone[key] = '[REDACTED]';
  }
  return clone;
}

export const globalErrorHandler = (
  err: any,
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const isOperational = err instanceof ApiError && err.isOperational;
  const statusCode = err.statusCode || 500;

  const logPayload = {
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    body: redactBody(req.body),
    params: req.params,
    query: req.query,
    user: req.user || 'Guest',
  };

  // only real bugs (500s / non-operational) go to error level and get alerted on
  if (statusCode >= 500 || !isOperational) {
    logger.error('Unhandled Error', logPayload);
  } else {
    logger.warn('Handled Client Error', logPayload);
  }

  // mask only unexpected/programming errors in production, never operational ones
  const message =
    !isOperational && process.env.NODE_ENV === 'production'
      ? 'Something went wrong'
      : err.message;

  return res.status(statusCode).json({
    success: false,
    message,
    errors: err.errors || [],
  });
};