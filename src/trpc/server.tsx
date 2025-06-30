import 'server-only'; // <-- ensure this file cannot be imported from the client
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query';
import { cache } from 'react';
import { createTRPCContext } from './init';
import { makeQueryClient } from './query-client';
import { appRouter } from './routers/_app';
// IMPORTANT: Create a stable getter for the query client that
//            will return the same client during the same request.
export const getQueryClient = cache(makeQueryClient);
export const trpc = createTRPCOptionsProxy({
  ctx: createTRPCContext,
  router: appRouter,
  queryClient: getQueryClient,
});
// this server module for TRPC will allow us to natively call TRPC procedures in server components and include or preserving auth state
//this means there is no fetch request will happen like others modules it will directly call TRPC procedures

// This is the caller factory that can be used to call TRPC procedures from server components
// to get data in a server component
export const caller = appRouter.createCaller(createTRPCContext);