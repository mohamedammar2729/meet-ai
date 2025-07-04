import { auth } from '@/lib/auth';
import { loadSearchParams } from '@/modules/agents/params';
import { AgentsListHeaders } from '@/modules/agents/ui/components/agents-list-header';
import {
  AgentsView,
  AgentsViewError,
  AgentsViewLoading,
} from '@/modules/agents/ui/views/agents-view';
import { getQueryClient, trpc } from '@/trpc/server';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import type { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

interface Props {
  searchParams: Promise<SearchParams>;
}

const Page = async ({ searchParams }: Props) => {
  const filters = await loadSearchParams(searchParams);

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/sign-in');
  }
  // This is a server component, so you can fetch data directly here
  // we use the getQueryClient function This is useful for server-side rendering or prefetching data
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(
    trpc.agents.getMany.queryOptions({
      ...filters,
    })
  );

  return (
    <>
      <AgentsListHeaders />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<AgentsViewLoading />}>
          <ErrorBoundary fallback={<AgentsViewError />}>
            <AgentsView />
          </ErrorBoundary>
        </Suspense>
      </HydrationBoundary>
    </>
  );
};

export default Page;

//Dehydration means converting the data (usually from a query) into a form that can be sent over the network or embedded into HTML, often as JSON.
//This is useful for server-side rendering (SSR) or static site generation (SSG) where you want to send the initial data to the client.
// data will be cached on the client side, so it can be used immediately without needing to refetch it
