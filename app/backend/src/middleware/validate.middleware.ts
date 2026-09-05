import type { Request, Response, NextFunction, Handler } from 'express';
import type { ZodTypeAny } from 'zod';
import asyncHandler from '../utils/asyncHandler.js';

export interface RequestValidationSchema {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

export const validateRequest = (schema: RequestValidationSchema): Handler => {
  return asyncHandler(
    async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
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
    }
  );
};

export default validateRequest;
