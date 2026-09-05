import { Router } from 'express';
import { authenticate, requireMinRole } from '../../middleware/auth.middleware.js';
import { getDashboard, getKPIs, getDepartmentCost, getMonthlyTrend, getAlerts } from './dashboard.controller.js';

const router: Router = Router();
router.use(authenticate);
router.use(requireMinRole('HR_MANAGER'));

router.get('/', getDashboard);
router.get('/kpis', getKPIs);
router.get('/department-cost', getDepartmentCost);
router.get('/monthly-trend', getMonthlyTrend);
router.get('/alerts', getAlerts);

export default router;
