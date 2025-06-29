'use client';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';

import { useRouter } from 'next/navigation';

export const HomeView = () => {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  if (!session) {
    return (
      <div className='flex flex-col gap-y-4 p-4'>
        <p>You are not logged in.</p>
        <p>Please log in to access this page.</p>
      </div>
    );
  }
  return (
    <div className='flex flex-col gap-y-4 p-4'>
      <p> Logged in as {session.user.name}</p>
      <Button
        onClick={() => {
          authClient.signOut({
            fetchOptions: { onSuccess: () => router.push('/sign-in') },
          });
        }}
      >
        SignOut
      </Button>
    </div>
  );
};
