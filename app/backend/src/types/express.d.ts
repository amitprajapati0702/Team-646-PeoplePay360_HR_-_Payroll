import 'express';
import type { Logger } from 'pino';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      log?: Logger;
      validatedBody?: unknown;
      user?: {
        id: string;
        email: string;
        role: string;
        employeeId?: string | null;
        sessionId?: string;
      };
    }
  }
}

export {};