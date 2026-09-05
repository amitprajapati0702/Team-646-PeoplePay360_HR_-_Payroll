import { Router } from 'express';
import validateRequest from '../../middleware/validate.middleware.js';
import {
  createEmployeeBodySchema,
  updateEmployeeBodySchema,
  employeeIdParamSchema,
  queryEmployeesQuerySchema,
  kanbanQuerySchema,
  updateEmployeeStatusBodySchema,
} from './employee.schema.js';
import {
  listEmployees,
  getKanbanView,
  getEmployeeById,
  getReportingTree,
  createEmployee,
  updateEmployee,
  updateEmployeeStatus,
  deleteEmployee,
} from './employee.controller.js';

const router: Router = Router();

router.get('/', validateRequest({ query: queryEmployeesQuerySchema }), listEmployees);
router.get('/kanban', validateRequest({ query: kanbanQuerySchema }), getKanbanView);
router.get('/:id', validateRequest({ params: employeeIdParamSchema }), getEmployeeById);
router.get('/:id/hierarchy', validateRequest({ params: employeeIdParamSchema }), getReportingTree);

router.post('/', validateRequest({ body: createEmployeeBodySchema }), createEmployee);
router.patch(
  '/:id',
  validateRequest({ params: employeeIdParamSchema, body: updateEmployeeBodySchema }),
  updateEmployee
);
router.patch(
  '/:id/status',
  validateRequest({ params: employeeIdParamSchema, body: updateEmployeeStatusBodySchema }),
  updateEmployeeStatus
);
router.delete('/:id', validateRequest({ params: employeeIdParamSchema }), deleteEmployee);

export default router;
