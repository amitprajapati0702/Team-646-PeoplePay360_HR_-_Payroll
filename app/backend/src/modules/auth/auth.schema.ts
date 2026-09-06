import { z } from 'zod';

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_\-#])[A-Za-z\d@$!%*?&_\-#]{8,}$/;

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(
    passwordPattern,
    'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character'
  );

export const registerBodySchema = z
  .object({
    email: z.string().trim().email('Invalid email address').toLowerCase(),
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Password confirmation is required'),
    firstName: z.string().trim().min(1, 'First name is required').max(100),
    lastName: z.string().trim().min(1, 'Last name is required').max(100),
    role: z
      .enum(['EMPLOYEE', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'ADMIN'])
      .optional()
      .default('EMPLOYEE'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const loginBodySchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenBodySchema = z.object({
  refreshToken: z.string().optional(),
});

export const changePasswordBodySchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Password confirmation is required'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterInput = z.infer<typeof registerBodySchema>;
export type LoginInput = z.infer<typeof loginBodySchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenBodySchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordBodySchema>;
