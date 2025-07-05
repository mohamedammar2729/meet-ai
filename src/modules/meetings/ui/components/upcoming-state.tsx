import { EmptyState } from '@/components/empty-state';
import Link from '@/components/link';
import { Button } from '@/components/ui/button';
import { BanIcon, VideoIcon } from 'lucide-react';

interface Props {
  meetingId: string;
  onCancelMeeting: () => void;
  isCancelling: boolean;
}

export const UpcomingState = ({
  meetingId,
  onCancelMeeting,
  isCancelling,
}: Props) => {
  return (
    <div className='bg-white rounded-lg px-4 py-5 flex flex-col items-center justify-center gap-y-8'>
      <EmptyState
        image='/upcoming.svg'
        title='Not Started Yet'
        describtion='Once you start this meeting, the sammary will appear here.'
      />
      <div className='flex flex-col-reverse lg:flex-row lg:justify-center items-center gap-2 w-full'>
        <Button
          variant='secondary'
          className='w-full lg:w-auto'
          onClick={onCancelMeeting}
          disabled={isCancelling}
        >
          <BanIcon />
          Cancel meeting
        </Button>
        <Button asChild className='w-full lg:w-auto' disabled={isCancelling}>
          <Link href={`/call/${meetingId}`}>
            <VideoIcon />
            Start meeting
          </Link>
        </Button>
      </div>
    </div>
  );
};
