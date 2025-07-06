'use client';

import { LoaderIcon } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { generateAvatarUri } from '@/lib/avatar';
import { CallConnect } from './call-connect';

interface Props {
  meetingId: string;
  meetingName: string;
}

export const CallProvider = ({ meetingId, meetingName }: Props) => {
  const { data, isPending } = authClient.useSession();
  if (!data || isPending) {
    return (
      <div className='flex items-center justify-center h-screen bg-radial from-sidebar-accent to-sidebar'>
        <LoaderIcon className='animate-spin size-6 text-white' />
      </div>
    );
  }
  return (
    <CallConnect
      meetingId={meetingId}
      meetingName={meetingName}
      userId={data.user.id}
      userName={data.user.name}
      userImage={
        data?.user.image ??
        generateAvatarUri({ seed: data.user.name, variant: 'initials' })
      }
    />
  );
};
