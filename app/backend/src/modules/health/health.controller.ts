import type {Handler, Request,Response} from 'express'

import httpStatus from '../../utils/http-status.js'
import ApiResponse from '../../utils/ApiResponse.js'
import asyncHandler from '../../utils/asyncHandler.js'

import { healthservice } from './health.service.js'


export const getHealth: Handler = asyncHandler(
  async (_req: Request, res: Response) => {
    const health = await healthservice.getHealth();

    return res.status(httpStatus.OK).json(
      new ApiResponse({
        message: "Service is healthy.",
        data: health,
      }),
    );
  },
);