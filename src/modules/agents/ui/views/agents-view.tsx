'use client';

import { ResponsiveDialog } from '@/components/responsive-dialog';
import { Button } from '@/components/ui/button';
import { useTRPC } from '@/trpc/client';
import { useSuspenseQuery } from '@tanstack/react-query';

export const AgentsView = () => {
  const trpc = useTRPC();
  // we used useSuspenseQuery instead of useQuery it get prefetched data from the server
  const { data } = useSuspenseQuery(trpc.agents.getMany.queryOptions());

  return (
    <div>
      <ResponsiveDialog
        open={true}
        onOpenChange={() => {}}
        title='Agents List'
        description='List of all agents'
      >
        <Button>Some actions</Button>
      </ResponsiveDialog>
      {JSON.stringify(data, null, 2)}
    </div>
  );
};
