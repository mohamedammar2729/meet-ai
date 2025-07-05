import { EmptyState } from '@/components/empty-state';
import Link from '@/components/link';
import { Button } from '@/components/ui/button';
import { VideoIcon } from 'lucide-react';

interface Props {
  meetingId: string;
}

export const ActiveState = ({ meetingId }: Props) => {
  return (
    <div className='bg-white rounded-lg px-4 py-5 flex flex-col items-center justify-center gap-y-8'>
      <EmptyState
        image='/upcoming.svg'
        title='Meeting is active'
        describtion='Meeting will end once all participants have left.'
      />
      <div className='flex flex-col-reverse lg:flex-row lg:justify-center items-center gap-2 w-full'>
        <Button asChild className='w-full lg:w-auto'>
          <Link href={`/call/${meetingId}`}>
            <VideoIcon />
            Join meeting
          </Link>
        </Button>
      </div>
    </div>
  );
};
