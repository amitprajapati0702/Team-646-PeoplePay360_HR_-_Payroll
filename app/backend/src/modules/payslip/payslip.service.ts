import { db } from '../../infrastructure/database/client.js';
import { payslips } from '../../infrastructure/database/schema/index.js';
import { eq, and } from 'drizzle-orm';
import ApiError from '../../utils/Apierror.js';
import httpStatus from '../../utils/http-status.js';
import nodemailer from 'nodemailer';

export class PayslipService {
  async getPayslipById(id: string) {
    const payslip = await db.query.payslips.findFirst({
      where: eq(payslips.id, id),
      with: {
        employee: {
          columns: {
            id: true, firstName: true, lastName: true, employeeCode: true,
            workEmail: true, personalEmail: true, avatarUrl: true,
            bankName: true, bankAccountNumber: true, bankAccountHolderName: true,
          },
        },
        contract: {
          columns: { id: true, contractReference: true, wage: true, startDate: true, endDate: true },
        },
        salaryStructure: { columns: { id: true, name: true, code: true } },
        payrun: { columns: { id: true, name: true, batchCode: true, periodStart: true, periodEnd: true, status: true } },
        lines: {
          with: { category: true },
          orderBy: (l, { asc }) => [asc(l.sequence)],
        },
      },
    });

    if (!payslip) {
      throw new ApiError({ statuscode: httpStatus.NOT_FOUND, message: 'Payslip not found.', errorcode: 'PAYSLIP_NOT_FOUND' });
    }
    return payslip;
  }

  async listPayslipsForPayrun(payrunId: string) {
    return await db.query.payslips.findMany({
      where: eq(payslips.payrunId, payrunId),
      with: {
        employee: { columns: { id: true, firstName: true, lastName: true, employeeCode: true, avatarUrl: true } },
        salaryStructure: { columns: { id: true, name: true } },
        lines: { orderBy: (l, { asc }) => [asc(l.sequence)] },
      },
      orderBy: (p, { asc }) => [asc(p.payslipNumber)],
    });
  }

  async listPayslipsForEmployee(employeeId: string) {
    return await db.query.payslips.findMany({
      where: eq(payslips.employeeId, employeeId),
      with: {
        payrun: { columns: { id: true, name: true, batchCode: true, periodStart: true, periodEnd: true, status: true } },
        salaryStructure: { columns: { id: true, name: true } },
        employee: {
          columns: {
            id: true, firstName: true, lastName: true, employeeCode: true,
            workEmail: true, personalEmail: true, avatarUrl: true,
            bankName: true, bankAccountNumber: true, bankRoutingOrIfsc: true, bankAccountHolderName: true,
          },
          with: {
            department: { columns: { id: true, name: true, code: true } },
            jobPosition: { columns: { id: true, title: true } },
          },
        },
        lines: {
          with: { category: true },
          orderBy: (l, { asc }) => [asc(l.sequence)],
        },
      },
      orderBy: (p, { desc }) => [desc(p.periodStart)],
    });
  }

  async sendPayslipEmail(id: string) {
    const payslip = await this.getPayslipById(id);
    const recipientEmail = payslip.employee.workEmail || payslip.employee.personalEmail;

    if (!recipientEmail) {
      throw new ApiError({ statuscode: httpStatus.BAD_REQUEST, message: 'Employee has no email address to send payslip to.', errorcode: 'NO_EMAIL' });
    }

    // Configure Nodemailer with Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const periodLabel = `${payslip.payrun.periodStart} to ${payslip.payrun.periodEnd}`;
    const employeeName = `${payslip.employee.firstName} ${payslip.employee.lastName}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #4F46E5, #7C3AED); padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">PeoplePay<span style="color: #A5B4FC">360</span></h1>
          <p style="color: #C7D2FE; margin: 4px 0 0;">HR & Payroll Platform</p>
        </div>
        <div style="background: #F9FAFB; padding: 24px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 12px 12px;">
          <h2 style="color: #111827;">Hello ${employeeName},</h2>
          <p style="color: #6B7280;">Your payslip for the period <strong style="color: #111827">${periodLabel}</strong> is ready.</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background: #EEF2FF;">
              <td style="padding: 12px; font-weight: bold; color: #4338CA;">Payslip Number</td>
              <td style="padding: 12px; color: #111827;">${payslip.payslipNumber}</td>
            </tr>
            <tr>
              <td style="padding: 12px; font-weight: bold; color: #374151;">Period</td>
              <td style="padding: 12px; color: #111827;">${periodLabel}</td>
            </tr>
            <tr style="background: #F3F4F6;">
              <td style="padding: 12px; font-weight: bold; color: #374151;">Gross Salary</td>
              <td style="padding: 12px; color: #111827;">₹${parseFloat(payslip.grossAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td style="padding: 12px; font-weight: bold; color: #374151;">Deductions</td>
              <td style="padding: 12px; color: #DC2626;">₹${parseFloat(payslip.deductionAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr style="background: #ECFDF5; border: 2px solid #10B981;">
              <td style="padding: 12px; font-weight: bold; color: #065F46; font-size: 16px;">NET SALARY</td>
              <td style="padding: 12px; color: #065F46; font-size: 16px; font-weight: bold;">₹${parseFloat(payslip.netAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
          </table>
          
          <p style="color: #6B7280; font-size: 12px;">This is an automatically generated payslip. Please log into the PeoplePay360 portal for a detailed breakdown.</p>
        </div>
      </div>
    `;

    try {
      if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        // Stub mode — no SMTP configured
        console.log(`[STUB] Would send payslip email to ${recipientEmail} for payslip ${payslip.payslipNumber}`);
      } else {
        await transporter.sendMail({
          from: `"PeoplePay360 HR" <${process.env.GMAIL_USER}>`,
          to: recipientEmail,
          subject: `Your Payslip for ${periodLabel} — ${payslip.payslipNumber}`,
          html: htmlContent,
        });
      }

      // Mark as email sent
      await db.update(payslips).set({
        isEmailSent: true,
        emailSentAt: new Date(),
        updatedAt: new Date(),
      }).where(eq(payslips.id, id));

      return { success: true, sentTo: recipientEmail };
    } catch (err) {
      throw new ApiError({
        statuscode: httpStatus.INTERNAL_SERVER_ERROR,
        message: `Failed to send email: ${(err as Error).message}`,
        errorcode: 'EMAIL_SEND_FAILED',
      });
    }
  }

  async bulkSendEmails(payrunId: string) {
    const allPayslips = await db.query.payslips.findMany({
      where: and(eq(payslips.payrunId, payrunId), eq(payslips.isEmailSent, false)),
      columns: { id: true },
    });

    const results: Array<{ id: string; success: boolean; error?: string }> = [];
    for (const ps of allPayslips) {
      try {
        await this.sendPayslipEmail(ps.id);
        results.push({ id: ps.id, success: true });
      } catch (err) {
        results.push({ id: ps.id, success: false, error: (err as Error).message });
      }
    }

    return { total: allPayslips.length, results };
  }
}

export const payslipService = new PayslipService();
