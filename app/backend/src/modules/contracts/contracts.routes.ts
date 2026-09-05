import { Router } from 'express';
import validateRequest from '../../middleware/validate.middleware.js';
import { authenticate, requireMinRole } from '../../middleware/auth.middleware.js';
import {
  createContractSchema, updateContractSchema, contractIdParamSchema, contractQuerySchema,
} from './contracts.schema.js';
import {
  listContracts, getContractById, createContract, updateContract, deleteContract,
} from './contracts.controller.js';

const router: Router = Router();

router.use(authenticate);

router.get('/', validateRequest({ query: contractQuerySchema }), listContracts);
router.get('/:id', validateRequest({ params: contractIdParamSchema }), getContractById);
router.post('/', requireMinRole('HR_MANAGER'), validateRequest({ body: createContractSchema }), createContract);
router.patch('/:id', requireMinRole('HR_MANAGER'), validateRequest({ params: contractIdParamSchema, body: updateContractSchema }), updateContract);
router.delete('/:id', requireMinRole('HR_MANAGER'), validateRequest({ params: contractIdParamSchema }), deleteContract);

export default router;
