import { ErrorState } from '@/components/error-state';
import { LoadingState } from '@/components/loading-state';
import { AgentsView } from '@/modules/agents/ui/views/agents-view';
import { getQueryClient, trpc } from '@/trpc/server';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

const Page = async () => {
  // This is a server component, so you can fetch data directly here
  // we use the getQueryClient function This is useful for server-side rendering or prefetching data
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(trpc.agents.getMany.queryOptions());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense
        fallback={
          <LoadingState
            title='Loading Agents'
            describtion='This is may take a few seconds'
          />
        }
      >
        <ErrorBoundary
          fallback={
            <ErrorState
              title='Error Loading Agents'
              describtion='Something went wrong while loading agents. Please try again later.'
            />
          }
        >
          <AgentsView />
        </ErrorBoundary>
      </Suspense>
    </HydrationBoundary>
  );
};

export default Page;

//Dehydration means converting the data (usually from a query) into a form that can be sent over the network or embedded into HTML, often as JSON.
//This is useful for server-side rendering (SSR) or static site generation (SSG) where you want to send the initial data to the client.
// data will be cached on the client side, so it can be used immediately without needing to refetch it
