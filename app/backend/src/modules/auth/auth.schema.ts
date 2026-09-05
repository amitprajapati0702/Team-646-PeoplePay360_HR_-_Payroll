import { z } from 'zod';

export const loginBodySchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const changePasswordBodySchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

export type LoginInput = z.infer<typeof loginBodySchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordBodySchema>;
