import { Router } from "express";
import healthRouter from "../modules/health/health.route.js";
import employeeRouter from "../modules/employee/employee.routes.js";

const router: Router = Router();

router.use("/health", healthRouter);
router.use("/employees", employeeRouter);

export default router;