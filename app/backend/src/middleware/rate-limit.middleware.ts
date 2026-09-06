import type { Request, Response, NextFunction } from 'express';
import { redis } from '../infrastructure/redis/client.js';
import ApiError from '../utils/Apierror.js';
import httpStatus from '../utils/http-status.js';
import logger from '../config/logger.js';

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
  keyPrefix?: string;
}

// In-memory fallback map if Redis is not available
const memoryBuckets = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(options: RateLimitOptions) {
  const {
    windowMs,
    max,
    message = 'Too many requests. Please slow down and try again later.',
    keyPrefix = 'rl',
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    const identifier = (req as any).user?.id || req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${keyPrefix}:${identifier}`;

    try {
      if (redis.isOpen) {
        const current = await redis.incr(key);
        if (current === 1) {
          await redis.pExpire(key, windowMs);
        }
        const ttl = await redis.pTTL(key);

        res.setHeader('X-RateLimit-Limit', max);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, max - current));
        res.setHeader('X-RateLimit-Reset', Date.now() + (ttl > 0 ? ttl : windowMs));

        if (current > max) {
          res.setHeader('Retry-After', Math.ceil((ttl > 0 ? ttl : windowMs) / 1000));
          return next(
            new ApiError({
              statuscode: httpStatus.TOO_MANY_REQUESTS,
              message,
              errorcode: 'RATE_LIMIT_EXCEEDED',
            })
          );
        }
        return next();
      }
    } catch (err) {
      logger.warn(err, 'Redis rate-limiter fallback triggered');
    }

    // In-memory fallback
    const now = Date.now();
    let bucket = memoryBuckets.get(key);
    if (!bucket || now > bucket.resetTime) {
      bucket = { count: 0, resetTime: now + windowMs };
      memoryBuckets.set(key, bucket);
    }

    bucket.count += 1;
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - bucket.count));
    res.setHeader('X-RateLimit-Reset', bucket.resetTime);

    if (bucket.count > max) {
      res.setHeader('Retry-After', Math.ceil((bucket.resetTime - now) / 1000));
      return next(
        new ApiError({
          statuscode: httpStatus.TOO_MANY_REQUESTS,
          message,
          errorcode: 'RATE_LIMIT_EXCEEDED',
        })
      );
    }

    return next();
  };
}

// Preset limiters for key critical paths
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // max 30 login/register attempts per 15 min
  message: 'Too many authentication attempts. Please try again after 15 minutes.',
  keyPrefix: 'rl:auth',
});

export const payrunBatchRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // max 10 payrun compute/batch email operations per minute
  message: 'Payrun batch rate limit reached. Please wait before triggering another batch job.',
  keyPrefix: 'rl:payrun',
});
