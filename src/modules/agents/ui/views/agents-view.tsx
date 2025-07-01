'use client';

// import { ResponsiveDialog } from '@/components/responsive-dialog';
// import { Button } from '@/components/ui/button';
import { useTRPC } from '@/trpc/client';
import { useSuspenseQuery } from '@tanstack/react-query';
import { DataTable } from '../components/data-table';
import { columns } from '../components/columns';
import { EmptyState } from '@/components/empty-state';

export const AgentsView = () => {
  const trpc = useTRPC();
  // we used useSuspenseQuery instead of useQuery it get prefetched data from the server
  const { data } = useSuspenseQuery(trpc.agents.getMany.queryOptions());

  return (
    <div className='flex-1 pb-4 px-4 md:px-8 flex flex-col gap-y-4'>
      <DataTable data={data} columns={columns} />
      {data.length === 0 && (
        <EmptyState
          title='Create your first agent'
          describtion='Create your agent to join in meetings. Each agent will follow your instructions and can interact with participants during the call.'
        />
      )}
    </div>
  );
};
