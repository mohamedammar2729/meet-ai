'use client';

import FormFields from '@/components/form-fields/form-fields';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { OctagonAlertIcon } from 'lucide-react';
import Loader from '@/components/ui/loader';
import { signup } from '@/db/_actions/auth';
import useFormFields from '@/hooks/useFormFields';
import { IFormField } from '@/types/app';
import { Pages } from '@/types/enums';
import { ValidationErrors } from '@/validations/auth';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect } from 'react';
import Image from 'next/image';
import Link from '@/components/link';

const initialState: {
  message?: string;
  error?: ValidationErrors;
  status?: number | null;
  formData?: FormData | null;
} = {
  message: '',
  error: undefined,
  status: null,
  formData: null,
};

function SignUpForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState(signup, initialState);
  const { getFormFields } = useFormFields({
    slug: Pages.Register,
  });

  useEffect(() => {
    if (state.status === 201) {
      router.replace(`/${Pages.LOGIN}`);
    }
  }, [router, state.message, state.status]);

  return (
    <div className='flex flex-col gap-6'>
      <Card className='overflow-hidden p-0'>
        <CardContent className='grid p-0 md:grid-cols-2'>
          <form action={action} className='p-6 md:p-8'>
            <div className='flex flex-col gap-6'>
              <div className='flex flex-col items-center text-center'>
                <h1 className='text-2xl font-bold'>Let&apos;s get started</h1>
                <p className='text-muted-foreground text-balance'>
                  Create your account
                </p>
              </div>
              {getFormFields().map((field: IFormField) => {
                const fieldValue = state.formData?.get(field.name) as string;
                return (
                  <div key={field.name} className='grid gap-3'>
                    <FormFields
                      {...field}
                      error={state.error}
                      defaultValue={fieldValue}
                    />
                  </div>
                );
              })}
              {/* Error Alert */}
              {state.status && state.status !== 201 && state.message && (
                <Alert className='bg-destructive/10 border-none'>
                  <OctagonAlertIcon className='w-4 h-4 !text-destructive' />
                  <AlertTitle>{state.message}</AlertTitle>
                </Alert>
              )}
              <Button type='submit' disabled={pending} className='w-full'>
                {pending ? <Loader /> : 'Sign Up'}
              </Button>
              <div className='after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t'>
                <span className='bg-card relative text-muted-foreground z-10 px-2'>
                  Or continue with
                </span>
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <Button
                  variant='outline'
                  type='button'
                  className='w-full'
                  disabled={pending}
                >
                  Google
                </Button>
                <Button
                  variant='outline'
                  type='button'
                  className='w-full'
                  disabled={pending}
                >
                  GitHub
                </Button>
              </div>
              <div className='text-sm text-center'>
                If you already have an account,{' '}
                <Link 
                  href='/sign-in' 
                  className='underline underline-offset-4 hover:text-primary'
                >
                  Sign In
                </Link>
              </div>
            </div>
          </form>
          <div className='bg-radial from-green-700 to-green-900 relative hidden md:flex flex-col gap-y-4 items-center justify-center'>
            <Image src='/logo.svg' alt='Meet.AI Logo' width={92} height={92} />
            <p className='text-2xl font-semibold text-white'>Meet.AI</p>
          </div>
        </CardContent>
      </Card>
      <div className='text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4'>
        By signing Up, you agree to our{' '}
        <Link href='#' className='underline underline-offset-4'>
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href='#' className='underline underline-offset-4'>
          Privacy Policy
        </Link>
      </div>
    </div>
  );
}

export default SignUpForm;
