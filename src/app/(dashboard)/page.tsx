import { auth } from '@/lib/auth';
import { HomeView } from '@/modules/home/ui/views/home-view';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

const Page = async () => {

  // const data = await caller.hello({ text: 'server' });

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/sign-in');
  }

  // return <div>{data.greeting}</div>;

  return <HomeView />;
};

export default Page;
