import * as z from 'zod';

export const loginSchema = () => {
  return z.object({
    email: z.string().trim().email({
      message: 'Must be a valid email',
    }),
    password: z
      .string()
      .min(6, { message: 'Password must be at least 6 characters' })
      .max(40, { message: 'Password must be at most 40 characters' }),
  });
};

export const signupSchema = () => {
  return z
    .object({
      name: z.string().trim().min(1, {
        message: 'Name is required',
      }),
      email: z.string().trim().email({
        message: 'Must be a valid email',
      }),
      password: z
        .string()
        .min(6, { message: 'Password must be at least 6 characters' })
        .max(40, { message: 'Password must be at most 40 characters' }),
      confirmPassword: z
        .string()
        .min(6, { message: 'Confirm Password is required' }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Password do not match",
      path: ['confirmPassword'],
    });
};

export type ValidationErrors =
  | {
      [key: string]: string[];
    }
  | undefined;
