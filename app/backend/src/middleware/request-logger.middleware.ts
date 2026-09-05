import type { IncomingMessage, ServerResponse } from 'node:http';
import { pinoHttp } from 'pino-http';

import logger from "../config/logger.js";
import { REDACT_PATHS } from "../utils/log-redaction.js";

interface CustomIncomingMessage extends IncomingMessage {
  requestId?: string;
}

export const requestLoggerMiddleware = pinoHttp({
  logger: logger,

  genReqId: (req: IncomingMessage) => {
    return (req as CustomIncomingMessage).requestId || '';
  },

  customSuccessMessage(req: IncomingMessage, res: ServerResponse) {
    return `${req.method ?? 'UNKNOWN'} ${req.url ?? ''} completed with ${res.statusCode}`;
  },

  customErrorMessage(req: IncomingMessage, res: ServerResponse) {
    return `${req.method ?? 'UNKNOWN'} ${req.url ?? ''} failed with ${res.statusCode}`;
  },

  customLogLevel(_req: IncomingMessage, res: ServerResponse, error?: Error) {
    if (error || res.statusCode >= 500) {
      return 'error';
    }

    if (res.statusCode >= 400) {
      return 'warn';
    }

    return 'info';
  },

  customProps(req: IncomingMessage) {
    return {
      requestId: (req as CustomIncomingMessage).requestId,
    };
  },

  redact: {
    paths: REDACT_PATHS,
    censor: '[REDACTED]',
  },
});

export default requestLoggerMiddleware;
