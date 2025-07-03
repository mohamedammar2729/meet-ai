'use client';

import { useTRPC } from '@/trpc/client';
import { useSuspenseQuery } from '@tanstack/react-query';

import { columns } from '../components/columns';
import { EmptyState } from '@/components/empty-state';

import { useAgentsFilters } from '../../hooks/use-agents-filters';
import { DataPagination } from '../components/data-pagination';
import { useRouter } from 'next/navigation';
import { LoadingState } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { DataTable } from '@/components/data-table';

export const AgentsView = () => {
  const router = useRouter();
  const [filters, setFilters] = useAgentsFilters();
  const trpc = useTRPC();
  // we used useSuspenseQuery instead of useQuery it get prefetched data from the server
  const { data } = useSuspenseQuery(
    trpc.agents.getMany.queryOptions({
      // ...filters includes the search and page filters
      ...filters,
    })
  );

  return (
    <div className='flex-1 pb-4 px-4 md:px-8 flex flex-col gap-y-4'>
      <DataTable
        data={data.items}
        columns={columns}
        onRowClick={(row) => router.push(`/agents/${row.id}`)}
      />
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

export const AgentsViewLoading = () => {
  return (
    <LoadingState
      title='Loading Agents'
      description='This is may take a few seconds'
    />
  );
};

export const AgentsViewError = () => {
  return (
    <ErrorState
      title='Error Loading Agents'
      description='Something went wrong while loading agents. Please try again later.'
    />
  );
};
