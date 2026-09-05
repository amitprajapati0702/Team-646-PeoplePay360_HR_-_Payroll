import type { RequestHandler } from "express";

import  {ApiError} from "../utils/Apierror.js";
import httpStatus from "../utils/http-status.js";
import { ErrorCodes } from "../utils/error-codes.js";

const notFoundMiddleware : RequestHandler = (req,_res,next) => {
    next(
        new ApiError({
            statuscode:httpStatus.NOT_FOUND,
            message:`Route '${req.originalUrl}' not found`,
            errorcode:ErrorCodes.ROUTE_NOT_FOUND,
            isOperational:true
        })
    )

}


export default notFoundMiddleware