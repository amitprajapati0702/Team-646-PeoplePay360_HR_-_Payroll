import { Router } from "express";
import healthRouter from "../modules/health/health.route.js";
import employeeRouter from "../modules/employee/employee.routes.js";
import authRouter from "../modules/auth/auth.routes.js";
import organizationRouter from "../modules/organization/organization.routes.js";
import contractsRouter from "../modules/contracts/contracts.routes.js";
import attendanceRouter from "../modules/attendance/attendance.routes.js";
import timeOffRouter from "../modules/time-off/time-off.routes.js";
import salaryStructuresRouter from "../modules/salary-structures/salary-structures.routes.js";
import payrunRouter from "../modules/payrun/payrun.routes.js";
import payslipRouter from "../modules/payslip/payslip.routes.js";
import dashboardRouter from "../modules/dashboard/dashboard.routes.js";

const router: Router = Router();

router.use("/health", healthRouter);
router.use("/auth", authRouter);
router.use("/employees", employeeRouter);
router.use("/organization", organizationRouter);
router.use("/contracts", contractsRouter);
router.use("/attendance", attendanceRouter);
router.use("/time-off", timeOffRouter);
router.use("/salary-structures", salaryStructuresRouter);
router.use("/payruns", payrunRouter);
router.use("/payslips", payslipRouter);
router.use("/dashboard", dashboardRouter);

export default router;