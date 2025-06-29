'use server';

import { loginSchema, signupSchema } from '@/validations/auth';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';


export const login = async (
  credentials: Record<'email' | 'password', string> | undefined
) => {
  const result = loginSchema().safeParse(credentials);
  if (!result.success) {
    return {
      errors: result.error.formErrors.fieldErrors,
      status: 400,
    };
  }
  
  try {
    // Use Better Auth to handle authentication and session creation
    const response = await auth.api.signInEmail({
      body: {
        email: result.data.email,
        password: result.data.password,
      },
      headers: await headers(),
    });

    if (!response) {
      return {
        message: 'Invalid credentials',
        status: 401,
      };
    }
    return {
      user: response.user,
      status: 200,
      message: 'Login successful',
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      message: 'Invalid credentials',
      status: 401,
    };
  }
};

export const signup = async (prevState: unknown, formData: FormData) => {
  const result = signupSchema().safeParse(
    Object.fromEntries(formData.entries())
  );
  if (result.success === false) {
    return {
      error: result.error.formErrors.fieldErrors,
      formData,
    };
  }
  
  try {
    // Use Better Auth to handle user creation and authentication
    const response = await auth.api.signUpEmail({
      body: {
        name: result.data.name,
        email: result.data.email,
        password: result.data.password,
      },
      headers: await headers(),
    });

    if (!response) {
      return {
        status: 400,
        message: 'Failed to create account',
        formData,
      };
    }
    return {
      status: 201,
      message: "Account created successfully",
      user: response.user,
    };
  } catch (error: unknown) {
    console.error('Signup error:', error);
    
    // Check if it's a duplicate email error
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('duplicate') || errorMessage.includes('already exists')) {
      return {
        status: 409,
        message: 'User already exists',
        formData,
      };
    }
    
    return {
      status: 500,
      message: 'An unexpected error occurred',
      formData,
    };
  }
};