import { z } from 'zod';

const username = z.string().trim().toLowerCase().min(3, 'Tên đăng nhập cần ít nhất 3 ký tự').max(30, 'Tên đăng nhập tối đa 30 ký tự');
const email = z.string().trim().toLowerCase().pipe(z.email('Email không hợp lệ').max(320, 'Email quá dài'));

export const loginSchema = z.object({
  username,
  password: z.string().min(1, 'Nhập mật khẩu'),
});

export const registerSchema = z.object({
  fullName: z.string().trim().min(1, 'Nhập họ và tên').max(100, 'Họ và tên tối đa 100 ký tự'),
  username: username.regex(/^[a-z0-9._-]+$/, 'Chỉ dùng chữ thường, số, dấu chấm, gạch dưới hoặc gạch ngang'),
  email,
  password: z.string().min(8, 'Mật khẩu cần ít nhất 8 ký tự').max(72, 'Mật khẩu tối đa 72 ký tự'),
  confirmPassword: z.string(),
}).refine((value) => value.password === value.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Mật khẩu nhập lại không khớp',
});

export const verifyEmailSchema = z.object({
  email,
  code: z.string().regex(/^\d{6}$/, 'Nhập đủ 6 chữ số'),
});

export const verificationRequiredSchema = z.object({ email });

export type LoginInput = z.output<typeof loginSchema>;
export type RegisterInput = z.output<typeof registerSchema>;
export type VerifyEmailInput = z.output<typeof verifyEmailSchema>;
