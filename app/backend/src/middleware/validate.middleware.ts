import type { Request, Response, NextFunction, Handler } from 'express';
import type { ZodTypeAny, ZodError } from 'zod';
import ApiError from '../utils/Apierror.js';
import httpStatus from '../utils/http-status.js';
import { ErrorCodes } from '../utils/error-codes.js';

export interface RequestValidationSchema {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

export const validateRequest = (schema: RequestValidationSchema): Handler => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schema.params) {
        req.params = (await schema.params.parseAsync(req.params)) as Record<string, string>;
      }
      if (schema.query) {
        req.query = (await schema.query.parseAsync(req.query)) as unknown as Request['query'];
      }
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }
      next();
    } catch (error) {
      const zodError = error as ZodError;
      const formattedErrors = zodError.issues
        ? zodError.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          }))
        : error;

      next(
        new ApiError({
          statuscode: httpStatus.BAD_REQUEST,
          message: 'Validation failed for request parameters/body.',
          errorcode: ErrorCodes.VALIDATION_ERROR,
          details: formattedErrors,
        })
      );
    }
  };
};

export default validateRequest;
