CREATE TYPE "public"."attendance_status_enum" AS ENUM('PRESENT', 'LATE', 'HALF_DAY', 'ABSENT', 'OVERTIME', 'EXCEPTION');--> statement-breakpoint
CREATE TYPE "public"."computation_type_enum" AS ENUM('FIXED', 'PERCENTAGE', 'FORMULA');--> statement-breakpoint
CREATE TYPE "public"."contract_status_enum" AS ENUM('DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."day_of_week_enum" AS ENUM('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');--> statement-breakpoint
CREATE TYPE "public"."employee_status_enum" AS ENUM('PROBATION', 'ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED');--> statement-breakpoint
CREATE TYPE "public"."employment_type_enum" AS ENUM('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN');--> statement-breakpoint
CREATE TYPE "public"."payrun_status_enum" AS ENUM('DRAFT', 'COMPUTING', 'COMPUTED', 'VALIDATED', 'PAID', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."payslip_status_enum" AS ENUM('DRAFT', 'COMPUTED', 'VALIDATED', 'PAID', 'CANCELLED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."time_off_unit_enum" AS ENUM('DAYS', 'HOURS');--> statement-breakpoint
CREATE TYPE "public"."user_role_enum" AS ENUM('EMPLOYEE', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'ADMIN');--> statement-breakpoint
CREATE TYPE "public"."workflow_status_enum" AS ENUM('DRAFT', 'SUBMITTED', 'APPROVED', 'REFUSED', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"role" "user_role_enum" DEFAULT 'EMPLOYEE' NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(150) NOT NULL,
	"manager_id" uuid,
	"parent_department_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "departments_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "job_positions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"department_id" uuid NOT NULL,
	"title" varchar(150) NOT NULL,
	"code" varchar(50) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "job_positions_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "working_schedule_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"working_schedule_id" uuid NOT NULL,
	"day_of_week" "day_of_week_enum" NOT NULL,
	"work_from" time NOT NULL,
	"work_to" time NOT NULL,
	"break_duration_minutes" integer DEFAULT 60 NOT NULL,
	"daily_working_hours" numeric(4, 2),
	CONSTRAINT "uq_schedule_day" UNIQUE("working_schedule_id","day_of_week")
);
--> statement-breakpoint
CREATE TABLE "working_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(150) NOT NULL,
	"code" varchar(50) NOT NULL,
	"schedule_type" varchar(50) DEFAULT 'STANDARD' NOT NULL,
	"total_weekly_hours" numeric(5, 2) DEFAULT '40.00' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "working_schedules_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"employee_code" varchar(50) NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"work_email" varchar(255) NOT NULL,
	"personal_email" varchar(255),
	"phone" varchar(30),
	"gender" varchar(20),
	"date_of_birth" date,
	"joining_date" date NOT NULL,
	"exit_date" date,
	"department_id" uuid NOT NULL,
	"job_position_id" uuid NOT NULL,
	"manager_id" uuid,
	"working_schedule_id" uuid NOT NULL,
	"employment_type" "employment_type_enum" DEFAULT 'FULL_TIME' NOT NULL,
	"status" "employee_status_enum" DEFAULT 'ACTIVE' NOT NULL,
	"bank_name" varchar(150),
	"bank_account_number" varchar(100),
	"bank_routing_or_ifsc" varchar(50),
	"bank_account_holder_name" varchar(200),
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "employees_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "employees_employee_code_unique" UNIQUE("employee_code"),
	CONSTRAINT "employees_work_email_unique" UNIQUE("work_email")
);
--> statement-breakpoint
CREATE TABLE "salary_rule_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"code" varchar(50) NOT NULL,
	"parent_category_id" uuid,
	"sequence" integer DEFAULT 10 NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "salary_rule_categories_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "salary_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"name" varchar(150) NOT NULL,
	"code" varchar(50) NOT NULL,
	"sequence" integer DEFAULT 10 NOT NULL,
	"appears_on_payslip" boolean DEFAULT true NOT NULL,
	"computation_type" "computation_type_enum" DEFAULT 'FIXED' NOT NULL,
	"fixed_amount" numeric(15, 2) DEFAULT '0.00',
	"percentage" numeric(6, 3) DEFAULT '0.000',
	"percentage_base_rule_code" varchar(50),
	"formula_expression" text,
	"condition_expression" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "salary_rules_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "salary_structure_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salary_structure_id" uuid NOT NULL,
	"salary_rule_id" uuid NOT NULL,
	"sequence_override" integer,
	CONSTRAINT "uq_structure_rule" UNIQUE("salary_structure_id","salary_rule_id")
);
--> statement-breakpoint
CREATE TABLE "salary_structures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(150) NOT NULL,
	"description" text,
	"parent_structure_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "salary_structures_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_reference" varchar(100) NOT NULL,
	"employee_id" uuid NOT NULL,
	"department_id" uuid NOT NULL,
	"job_position_id" uuid NOT NULL,
	"salary_structure_id" uuid NOT NULL,
	"working_schedule_id" uuid NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"wage" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"status" "contract_status_enum" DEFAULT 'DRAFT' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "contracts_contract_reference_unique" UNIQUE("contract_reference")
);
--> statement-breakpoint
CREATE TABLE "attendances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"attendance_date" date NOT NULL,
	"check_in" timestamp with time zone NOT NULL,
	"check_out" timestamp with time zone,
	"worked_hours" numeric(5, 2) DEFAULT '0.00',
	"overtime_hours" numeric(5, 2) DEFAULT '0.00',
	"status" "attendance_status_enum" DEFAULT 'PRESENT' NOT NULL,
	"is_manually_edited" boolean DEFAULT false NOT NULL,
	"edited_by_user_id" uuid,
	"edit_reason" text,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "uq_employee_daily_attendance" UNIQUE("employee_id","attendance_date")
);
--> statement-breakpoint
CREATE TABLE "time_off_allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"time_off_type_id" uuid NOT NULL,
	"allocated_units" numeric(6, 2) NOT NULL,
	"taken_units" numeric(6, 2) DEFAULT '0.00' NOT NULL,
	"validity_start" date NOT NULL,
	"validity_end" date NOT NULL,
	"status" "workflow_status_enum" DEFAULT 'DRAFT' NOT NULL,
	"approved_by_user_id" uuid,
	"approved_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "time_off_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"time_off_type_id" uuid NOT NULL,
	"time_off_allocation_id" uuid,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"requested_units" numeric(5, 2) NOT NULL,
	"status" "workflow_status_enum" DEFAULT 'SUBMITTED' NOT NULL,
	"reason" text,
	"refusal_reason" text,
	"approved_by_user_id" uuid,
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "time_off_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"code" varchar(50) NOT NULL,
	"unit" time_off_unit_enum DEFAULT 'DAYS' NOT NULL,
	"requires_allocation" boolean DEFAULT true NOT NULL,
	"is_paid" boolean DEFAULT true NOT NULL,
	"color_code" varchar(10) DEFAULT '#3B82F6',
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "time_off_types_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "payruns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(150) NOT NULL,
	"batch_code" varchar(50) NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"default_salary_structure_id" uuid,
	"status" "payrun_status_enum" DEFAULT 'DRAFT' NOT NULL,
	"total_gross_amount" numeric(18, 2) DEFAULT '0.00',
	"total_deduction_amount" numeric(18, 2) DEFAULT '0.00',
	"total_net_amount" numeric(18, 2) DEFAULT '0.00',
	"total_payslip_count" integer DEFAULT 0,
	"created_by_user_id" uuid,
	"validated_by_user_id" uuid,
	"validated_at" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "payruns_batch_code_unique" UNIQUE("batch_code")
);
--> statement-breakpoint
CREATE TABLE "payslip_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payslip_id" uuid NOT NULL,
	"salary_rule_id" uuid,
	"category_id" uuid NOT NULL,
	"name" varchar(150) NOT NULL,
	"code" varchar(50) NOT NULL,
	"category_code" varchar(50) NOT NULL,
	"sequence" integer NOT NULL,
	"rate" numeric(6, 3) DEFAULT '0.000',
	"base_amount" numeric(15, 2) DEFAULT '0.00',
	"total_amount" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payslips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payslip_number" varchar(100) NOT NULL,
	"payrun_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"contract_id" uuid NOT NULL,
	"salary_structure_id" uuid NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"status" "payslip_status_enum" DEFAULT 'DRAFT' NOT NULL,
	"planned_working_days" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"actual_worked_days" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"approved_leave_days" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"unpaid_leave_days" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"base_wage" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"gross_amount" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"deduction_amount" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"net_amount" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"validation_warnings" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"pdf_storage_path" text,
	"is_email_sent" boolean DEFAULT false NOT NULL,
	"email_sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "payslips_payslip_number_unique" UNIQUE("payslip_number"),
	CONSTRAINT "uq_employee_payrun" UNIQUE("payrun_id","employee_id")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"action" varchar(50) NOT NULL,
	"entity_name" varchar(100) NOT NULL,
	"entity_id" uuid NOT NULL,
	"payload_before" jsonb,
	"payload_after" jsonb,
	"ip_address" varchar(45),
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "job_positions" ADD CONSTRAINT "job_positions_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "working_schedule_lines" ADD CONSTRAINT "working_schedule_lines_working_schedule_id_working_schedules_id_fk" FOREIGN KEY ("working_schedule_id") REFERENCES "public"."working_schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_job_position_id_job_positions_id_fk" FOREIGN KEY ("job_position_id") REFERENCES "public"."job_positions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_working_schedule_id_working_schedules_id_fk" FOREIGN KEY ("working_schedule_id") REFERENCES "public"."working_schedules"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_rules" ADD CONSTRAINT "salary_rules_category_id_salary_rule_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."salary_rule_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_structure_rules" ADD CONSTRAINT "salary_structure_rules_salary_structure_id_salary_structures_id_fk" FOREIGN KEY ("salary_structure_id") REFERENCES "public"."salary_structures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_structure_rules" ADD CONSTRAINT "salary_structure_rules_salary_rule_id_salary_rules_id_fk" FOREIGN KEY ("salary_rule_id") REFERENCES "public"."salary_rules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_job_position_id_job_positions_id_fk" FOREIGN KEY ("job_position_id") REFERENCES "public"."job_positions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_salary_structure_id_salary_structures_id_fk" FOREIGN KEY ("salary_structure_id") REFERENCES "public"."salary_structures"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_working_schedule_id_working_schedules_id_fk" FOREIGN KEY ("working_schedule_id") REFERENCES "public"."working_schedules"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_edited_by_user_id_users_id_fk" FOREIGN KEY ("edited_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_off_allocations" ADD CONSTRAINT "time_off_allocations_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_off_allocations" ADD CONSTRAINT "time_off_allocations_time_off_type_id_time_off_types_id_fk" FOREIGN KEY ("time_off_type_id") REFERENCES "public"."time_off_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_off_allocations" ADD CONSTRAINT "time_off_allocations_approved_by_user_id_users_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_off_requests" ADD CONSTRAINT "time_off_requests_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_off_requests" ADD CONSTRAINT "time_off_requests_time_off_type_id_time_off_types_id_fk" FOREIGN KEY ("time_off_type_id") REFERENCES "public"."time_off_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_off_requests" ADD CONSTRAINT "time_off_requests_time_off_allocation_id_time_off_allocations_id_fk" FOREIGN KEY ("time_off_allocation_id") REFERENCES "public"."time_off_allocations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_off_requests" ADD CONSTRAINT "time_off_requests_approved_by_user_id_users_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payruns" ADD CONSTRAINT "payruns_default_salary_structure_id_salary_structures_id_fk" FOREIGN KEY ("default_salary_structure_id") REFERENCES "public"."salary_structures"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payruns" ADD CONSTRAINT "payruns_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payruns" ADD CONSTRAINT "payruns_validated_by_user_id_users_id_fk" FOREIGN KEY ("validated_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payslip_lines" ADD CONSTRAINT "payslip_lines_payslip_id_payslips_id_fk" FOREIGN KEY ("payslip_id") REFERENCES "public"."payslips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payslip_lines" ADD CONSTRAINT "payslip_lines_salary_rule_id_salary_rules_id_fk" FOREIGN KEY ("salary_rule_id") REFERENCES "public"."salary_rules"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payslip_lines" ADD CONSTRAINT "payslip_lines_category_id_salary_rule_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."salary_rule_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_payrun_id_payruns_id_fk" FOREIGN KEY ("payrun_id") REFERENCES "public"."payruns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_salary_structure_id_salary_structures_id_fk" FOREIGN KEY ("salary_structure_id") REFERENCES "public"."salary_structures"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_employees_department" ON "employees" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "idx_employees_job_position" ON "employees" USING btree ("job_position_id");--> statement-breakpoint
CREATE INDEX "idx_employees_manager" ON "employees" USING btree ("manager_id");--> statement-breakpoint
CREATE INDEX "idx_employees_status" ON "employees" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_employees_type" ON "employees" USING btree ("employment_type");--> statement-breakpoint
CREATE INDEX "idx_contracts_employee_dates" ON "contracts" USING btree ("employee_id","start_date","end_date");--> statement-breakpoint
CREATE INDEX "idx_contracts_status" ON "contracts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_attendances_employee_date" ON "attendances" USING btree ("employee_id","attendance_date");--> statement-breakpoint
CREATE INDEX "idx_attendances_date_status" ON "attendances" USING btree ("attendance_date","status");--> statement-breakpoint
CREATE INDEX "idx_time_off_alloc_emp" ON "time_off_allocations" USING btree ("employee_id","validity_start","validity_end");--> statement-breakpoint
CREATE INDEX "idx_time_off_requests_emp" ON "time_off_requests" USING btree ("employee_id","status");--> statement-breakpoint
CREATE INDEX "idx_time_off_requests_dates" ON "time_off_requests" USING btree ("start_date","end_date");--> statement-breakpoint
CREATE INDEX "idx_payruns_period_status" ON "payruns" USING btree ("period_start","period_end","status");--> statement-breakpoint
CREATE INDEX "idx_payslip_lines_payslip_cat" ON "payslip_lines" USING btree ("payslip_id","category_code");--> statement-breakpoint
CREATE INDEX "idx_payslips_payrun" ON "payslips" USING btree ("payrun_id");--> statement-breakpoint
CREATE INDEX "idx_payslips_employee" ON "payslips" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "idx_payslips_period" ON "payslips" USING btree ("period_start","period_end");--> statement-breakpoint
CREATE INDEX "idx_payslips_status" ON "payslips" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_entity" ON "audit_logs" USING btree ("entity_name","entity_id");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_user" ON "audit_logs" USING btree ("user_id");