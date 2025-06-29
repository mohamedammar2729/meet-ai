'use client';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { OctagonAlertIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from '@/components/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { IFormField } from '@/types/app';
import FormFields from '@/components/form-fields/form-fields';
import { Pages } from '@/types/enums';
import useFormFields from '@/hooks/useFormFields';
import Loader from '@/components/ui/loader';

function SignInForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { getFormFields } = useFormFields({
    slug: Pages.LOGIN,
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRef.current) return;

    const formData = new FormData(formRef.current);

    const data: Record<string, string> = {};
    formData.forEach((value, key) => {
      data[key] = value.toString();
    });

    setError(null);
    setIsLoading(true);

    authClient.signIn.email(
      {
        email: data.email,
        password: data.password,
      },
      {
        onSuccess: () => {
          setIsLoading(false);
          router.push('/');
        },
        onError: (error) => {
          setIsLoading(false);
          setError(error.error.message);
        },
      }
    );
  };

  return (
    <div className='flex flex-col gap-6'>
      <Card className='overflow-hidden p-0'>
        <CardContent className='grid p-0 md:grid-cols-2'>
          <form onSubmit={onSubmit} ref={formRef} className='p-6 md:p-8'>
            <div className='flex flex-col gap-6'>
              <div className='flex flex-col items-center text-center'>
                <h1 className='text-2xl font-bold'>Welcome Back</h1>
                <p className='text-muted-foreground text-balance'>
                  Login to your account
                </p>
              </div>
              <div className='grid gap-3'>
                {getFormFields().map((field: IFormField) => (
                  <div className='mb-3' key={field.name}>
                    <FormFields
                      {...field}
                      error={error ? { [field.name]: [error] } : {}}
                    />
                  </div>
                ))}
              </div>
              {error && (
                <Alert className='bg-destructive/10 border-none'>
                  <OctagonAlertIcon className='w-4 h-4 !text-destructive' />
                  <AlertTitle>{error}</AlertTitle>
                </Alert>
              )}
              <Button type='submit' className='w-full' disabled={isLoading}>
                {isLoading ? <Loader /> : 'Sign In'}
              </Button>
              <div className='after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t'>
                <span className='bg-card relative text-muted-foreground z-10 px-2'>
                  Or continue with
                </span>
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <Button variant='outline' type='button' className='w-full'>
                  Google
                </Button>
                <Button variant='outline' type='button' className='w-full'>
                  GitHub
                </Button>
              </div>
              <div className='text-sm text-center'>
                Don&apos;t have an account?{' '}
                <Link href='/sign-up' className='underline underline-offset-4'>
                  Sign Up
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
        By signing in, you agree to our{' '}
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

export default SignInForm;
