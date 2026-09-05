import type { Request, Response, Handler } from 'express';
import httpStatus from '../../utils/http-status.js';
import ApiResponse from '../../utils/ApiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { employeeService } from './employee.service.js';
import type {
  CreateEmployeeInput,
  UpdateEmployeeInput,
  QueryEmployeesInput,
  KanbanQueryInput,
  UpdateEmployeeStatusInput,
} from './employee.schema.js';


export const listEmployees: Handler = asyncHandler(
  async (req: Request, res: Response) => {
    const filters = req.query as unknown as QueryEmployeesInput;
    const result = await employeeService.listEmployees(filters);

    return res.status(httpStatus.OK).json(
      new ApiResponse({
        message: 'Employees retrieved successfully.',
        data: result.items,
        meta: result.pagination,
      })
    );
  }
);

export const getFormOptions: Handler = asyncHandler(
  async (_req: Request, res: Response) => {
    const options = await employeeService.getFormOptions();

    return res.status(httpStatus.OK).json(
      new ApiResponse({
        message: 'Employee form options retrieved successfully.',
        data: options,
      })
    );
  }
);

export const getKanbanView: Handler = asyncHandler(
  async (req: Request, res: Response) => {
    const query = req.query as unknown as KanbanQueryInput;
    const data = await employeeService.getKanbanData(query);

    return res.status(httpStatus.OK).json(
      new ApiResponse({
        message: 'Kanban view retrieved successfully.',
        data,
      })
    );
  }
);

export const getEmployeeById: Handler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const employee = await employeeService.getEmployeeById(id);

    return res.status(httpStatus.OK).json(
      new ApiResponse({
        message: 'Employee details retrieved successfully.',
        data: employee,
      })
    );
  }
);

export const getReportingTree: Handler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const hierarchy = await employeeService.getReportingTree(id);

    return res.status(httpStatus.OK).json(
      new ApiResponse({
        message: 'Reporting hierarchy retrieved successfully.',
        data: hierarchy,
      })
    );
  }
);

export const createEmployee: Handler = asyncHandler(
  async (req: Request, res: Response) => {
    const body = req.body as CreateEmployeeInput;
    const actingUserId = req.user?.id;
    const created = await employeeService.createEmployee(body, actingUserId);

    return res.status(httpStatus.CREATED).json(
      new ApiResponse({
        message: 'Employee created successfully.',
        data: created,
      })
    );
  }
);

export const updateEmployee: Handler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const body = req.body as UpdateEmployeeInput;
    const actingUserId = req.user?.id;
    const updated = await employeeService.updateEmployee(id, body, actingUserId);

    return res.status(httpStatus.OK).json(
      new ApiResponse({
        message: 'Employee profile updated successfully.',
        data: updated,
      })
    );
  }
);

export const updateEmployeeStatus: Handler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const body = req.body as UpdateEmployeeStatusInput;
    const actingUserId = req.user?.id;
    const updated = await employeeService.updateEmployeeStatus(id, body, actingUserId);

    return res.status(httpStatus.OK).json(
      new ApiResponse({
        message: `Employee status transitioned to ${body.status} successfully.`,
        data: updated,
      })
    );
  }
);

export const deleteEmployee: Handler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const actingUserId = req.user?.id;
    const deleted = await employeeService.deleteEmployee(id, actingUserId);

    return res.status(httpStatus.OK).json(
      new ApiResponse({
        message: 'Employee record deleted successfully.',
        data: deleted,
      })
    );
  }
);
