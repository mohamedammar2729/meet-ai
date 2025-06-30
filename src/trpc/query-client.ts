import {
  defaultShouldDehydrateQuery,
  QueryClient,
} from '@tanstack/react-query';
// import superjson from 'superjson';
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
      },
      dehydrate: {
        //This is a function that determines whether a query should be dehydrated or not. Since the RSC transport protocol supports hydrating promises over the network
        //Dehydration means converting the data (usually from a query) into a form that can be sent over the network or embedded into HTML, often as JSON.
        //This is useful for server-side rendering (SSR) or static site generation (SSG) where you want to send the initial data to the client.
        //Hydration is the reverse — turning that serialized data back into a usable format on the client side (like restoring a query result into React Query or TanStack Query cache).
        shouldDehydrateQuery: (query) =>
          // function to also include queries that are still pending
          defaultShouldDehydrateQuery(query) ||
          query.state.status === 'pending',
      },
      hydrate: {
        // deserializeData: superjson.deserialize,
      },
    },
  });
}

//In tRPC’s docs, it refers to a function that decides:
// Should this query result be dehydrated (converted into JSON and embedded in the response)?
//Or should it stay as a promise and let React Server Components handle it over the network?

