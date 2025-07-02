'use client';

// import { ResponsiveDialog } from '@/components/responsive-dialog';
// import { Button } from '@/components/ui/button';
import { useTRPC } from '@/trpc/client';
import { useSuspenseQuery } from '@tanstack/react-query';
import { DataTable } from '../components/data-table';
import { columns } from '../components/columns';
import { EmptyState } from '@/components/empty-state';

import { useAgentsFilters } from '../../hooks/use-agents-filters';
import { DataPagination } from '../components/data-pagination';


export const AgentsView = () => {
  const [filters, setFilters] = useAgentsFilters();
  const trpc = useTRPC();
  // we used useSuspenseQuery instead of useQuery it get prefetched data from the server
  const { data } = useSuspenseQuery(trpc.agents.getMany.queryOptions({
    // ...filters includes the search and page filters
    ...filters,
  }));

  return (
    <div className='flex-1 pb-4 px-4 md:px-8 flex flex-col gap-y-4'>
      <DataTable data={data.items} columns={columns} />
      <DataPagination
        Page={filters.page}
        totalPages={data.totalPages}
        onPageChange={(page) => setFilters({ page })}
      />
      {data.items.length === 0 && (
        <EmptyState
          title='Create your first agent'
          describtion='Create your agent to join in meetings. Each agent will follow your instructions and can interact with participants during the call.'
        />
      )}
    </div>
  );
};
