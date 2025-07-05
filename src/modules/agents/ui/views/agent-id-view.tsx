'use client';
import { ErrorState } from '@/components/error-state';
import { LoadingState } from '@/components/loading-state';
import { useTRPC } from '@/trpc/client';
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { AgentIdViewHeader } from '../components/agent-id-view-header';
import { GeneratedAvatar } from '@/components/generated-avatar';
import { Badge } from '@/components/ui/badge';
import { VideoIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useConfirm } from '@/hooks/use-confirm';
import { useState } from 'react';
import { UpdateAgentDialog } from '../components/update-agent-dialog';

interface Props {
  agentId: string;
}

export const AgentIdView = ({ agentId }: Props) => {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [updateAgentDialogOpen, setUpdateAgentDialogOpen] = useState(false);

  const { data } = useSuspenseQuery(
    trpc.agents.getOne.queryOptions({ id: agentId })
  );

  const removeAgent = useMutation(
    trpc.agents.remove.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.agents.getMany.queryOptions({}));
        router.push('/agents');
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const [RemoveConfirmation, confirmRemove] = useConfirm(
    'Are you sure ?',
    `The following action will remove the agent ${data.meetingCount} associated meetings.`
  );

  const handleRemoveAgent = async () => {
    const ok = await confirmRemove();
    if (!ok) return;
    await removeAgent.mutateAsync({ id: agentId });
  };

  return (
    <>
      <RemoveConfirmation />
      <UpdateAgentDialog
        open={updateAgentDialogOpen}
        onOpenChange={setUpdateAgentDialogOpen}
        initialValues={data}
      />
      <div className='flex-1 px-4 py-4 md:px-8 flex flex-col gap-y-4'>
        <AgentIdViewHeader
          agentId={agentId}
          agentName={data.name}
          onEdit={() => setUpdateAgentDialogOpen(true)}
          onRemove={handleRemoveAgent}
        />
        <div className='bg-white rounded-lg border'>
          <div className='px-4 py-5 gap-y-5 flex flex-col col-span-5'>
            <div className='flex items-center gap-x-3'>
              <GeneratedAvatar
                seed={data.name}
                variant='botttsNeutral'
                className='size-10'
              />
              <h2 className='text-2xl font-medium'>{data.name}</h2>
            </div>
            <Badge className='flex items-center gap-x-2 [&> svg]:size-4'>
              <VideoIcon className='text-blue-700' />
              {data.meetingCount}{' '}
              {data.meetingCount === 1 ? 'Meeting' : 'Meetings'}
            </Badge>
            <div className='flex flex-col gap-y-4'>
              <p className='text-lg font-medium'>Instructions</p>
              <p className='text-neutral-800'>{data.instructions}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export const AgentsIdViewLoading = () => {
  return (
    <LoadingState
      title='Loading Agent'
      description='This is may take a few seconds'
    />
  );
};

export const AgentsIdViewError = () => {
  return (
    <ErrorState
      title='Error Loading Agent'
      description='Something went wrong while loading agents. Please try again later.'
    />
  );
};
