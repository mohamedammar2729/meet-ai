import { auth } from '@/lib/auth';
import { SignInView } from '@/modules/auth/ui/views/use-submit/sign-in-view';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

const Page = async () => {
  const session = await auth.api.getSession({
      headers: await headers(),
    });
  
    if (!!session) {
      redirect("/");
    }
  return <SignInView />;
};

export default Page;
