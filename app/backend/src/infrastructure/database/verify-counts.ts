import 'dotenv/config';
import { db } from './client.js';
import { sql } from 'drizzle-orm';

async function verify() {
  const tables = [
    'users',
    'departments',
    'job_positions',
    'working_schedules',
    'working_schedule_lines',
    'employees',
    'contracts',
    'salary_rules',
    'attendances',
    'time_off_allocations',
    'time_off_requests',
    'payruns',
    'payslips',
    'payslip_lines',
    'audit_logs'
  ];

  console.log('\n========================================');
  console.log('📊 DATABASE TABLE RECORD COUNTS:');
  console.log('========================================');

  for (const t of tables) {
    const res: any = await db.execute(sql.raw(`SELECT count(*) as cnt FROM ${t}`));
    const cnt = res[0]?.cnt ?? res.rows?.[0]?.cnt ?? '0';
    console.log(`  ${t.padEnd(25)}: ${cnt} records`);
  }
  console.log('========================================\n');
  process.exit(0);
}

verify().catch(console.error);
