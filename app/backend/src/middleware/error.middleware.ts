import type { ErrorRequestHandler } from "express";

import ApiError from "../utils/Apierror.js";
import httpStatus from "../utils/http-status.js";
import logger from "../config/logger.js";


const errorMiddleware:ErrorRequestHandler = (error,req,res,_next)=>{
    let err = error
    
    if(!(err instanceof ApiError)){
        logger.error(err)

        err = new ApiError({
            statuscode:httpStatus.INTERNAL_SERVER_ERROR,
            message:"Something Wrong",
            errorcode:"INTERNAL_SERVER ERROR",
            isOperational:false
        })
    }

    const status = (err as unknown as {statusCode?: number}).statusCode || (err as unknown as {statuscode?: number}).statuscode || httpStatus.INTERNAL_SERVER_ERROR;

    if (status >= 500) {
        logger.error({
            requestId: req.requestId,
            error: err,
        });
    } else {
        logger.warn({
            requestId: req.requestId,
            path: req.originalUrl,
            message: err.message,
        });
    }

    res.status(status).json({
        success: false,
        message: err.message || "An unexpected error occurred",
        error: {
            code: (err as unknown as {errorcode?: string}).errorcode || "INTERNAL_SERVER_ERROR",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            details: (err as unknown as {details?: unknown}).details ?? null,
        },
        requestId: req.requestId,
        stack: process.env.NODE_ENV === "development" ? err.stack : null,
    });
};

export default errorMiddleware;