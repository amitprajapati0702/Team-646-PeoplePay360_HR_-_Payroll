import type{Request,Response,NextFunction} from "express"
import logger from '../config/logger.js';
import {createId} from '@paralleldrive/cuid2'

export function requestIdMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
): void {
    // Honour a manually supplied header, otherwise generate a fresh id
    const incomingId = req.headers['x-request-id'];
    const requestId =
        typeof incomingId === 'string' && incomingId.trim() !== ''
            ? incomingId.trim()
            : createId();

    // Store on the request object (available everywhere that has `req`)
    req.requestId = requestId;

    // Echo it back in the response so the client can correlate logs
    res.setHeader('X-Request-Id', requestId);

    // Create a child logger with requestId permanently bound.
    // Every req.log.info / req.log.error etc. will include it automatically.
    req.log = logger.child({ requestId });

    next();
}

export default requestIdMiddleware


