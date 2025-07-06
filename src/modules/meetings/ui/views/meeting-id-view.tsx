'use client';
import { ErrorState } from '@/components/error-state';
import { LoadingState } from '@/components/loading-state';
import { useTRPC } from '@/trpc/client';
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useConfirm } from '@/hooks/use-confirm';
import { useState } from 'react';
import { UpdateMeetingDialog } from '../components/update-meeting-dialog';
import { MeetingIdViewHeader } from '../components/meeting-id-view-header';
import { UpcomingState } from '../components/upcoming-state';
import { ActiveState } from '../components/active-state';
import { CancelState } from '../components/cancelled-state';
import { ProcessingState } from '../components/processing-state';
import { CompletedState } from '../components/completed-state';

interface Props {
  meetingId: string;
}

export const MeetingIdView = ({ meetingId }: Props) => {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [updateMeetingDialogOpen, setUpdateMeetingDialogOpen] = useState(false);

  const { data } = useSuspenseQuery(
    trpc.meetings.getOne.queryOptions({ id: meetingId })
  );

  const removeMeeting = useMutation(
    trpc.meetings.remove.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.meetings.getMany.queryOptions({}));
        router.push('/meetings');
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const [RemoveConfirmation, confirmRemove] = useConfirm(
    'Are you sure ?',
    `The following action will remove this meeting.`
  );

  const handleRemoveMeeting = async () => {
    const ok = await confirmRemove();
    if (!ok) return;
    await removeMeeting.mutateAsync({ id: meetingId });
  };

  const isActive = data.status === 'active';
  const isUpcoming = data.status === 'upcoming';
  const isCompleted = data.status === 'completed';
  const isCancelled = data.status === 'cancelled';
  const isProcessing = data.status === 'processing';

  return (
    <>
      <RemoveConfirmation />
      <UpdateMeetingDialog
        open={updateMeetingDialogOpen}
        onOpenChange={setUpdateMeetingDialogOpen}
        initialValues={data}
      />
      <div className='flex-1 px-4 py-4 md:px-8 flex flex-col gap-y-4'>
        <MeetingIdViewHeader
          meetingId={meetingId}
          meetingName={data.name}
          onEdit={() => setUpdateMeetingDialogOpen(true)}
          onRemove={handleRemoveMeeting}
        />
        {isCancelled && <CancelState />}
        {isCompleted && <CompletedState data={data} />}
        {isProcessing && <ProcessingState />}
        {isActive && <ActiveState meetingId={meetingId} />}
        {isUpcoming && (
          <UpcomingState
            meetingId={meetingId}
            onCancelMeeting={() => {}}
            isCancelling={false}
          />
        )}
      </div>
    </>
  );
};

export const MeetingIdViewLoading = () => {
  return (
    <LoadingState
      title='Loading Meetings'
      description='This is may take a few seconds'
    />
  );
};

export const MeetingIdViewError = () => {
  return (
    <ErrorState
      title='Error Loading Meetings'
      description='Something went wrong while loading meetingId. Please try again later.'
    />
  );
};
