import { useState } from 'react';
import { StreamTheme, useCall } from '@stream-io/video-react-sdk';
import { CallLobby } from './call-lobby';
import { CallActive } from './call-active';
import { CallEnded } from './call-ended';
interface Props {
  meetingName: string;
}

export const CallUI = ({ meetingName }: Props) => {
  // Use the useCall hook to access the call state
  const call = useCall();
  // Define the state to manage the visibility of different UI components
  // 'lobby' for the lobby screen, 'call' for the active call,
  const [show, setShow] = useState<'lobby' | 'call' | 'ended'>('lobby');

  const handlejoinCall = async () => {
    if (!call) return;
    // Logic to join the call
    await call.join();
    // After joining, switch to the call view
    setShow('call');
  };

  const handleLeaveCall = async () => {
    if (!call) return;
    // Logic to leave the call
    call.endCall();
    // After leaving, switch to the lobby view
    setShow('ended');
  };

  return (
    <StreamTheme className='h-full'>
      {show === 'lobby' && <CallLobby onJoin={handlejoinCall} />}
      {show === 'call' && <CallActive onLeave={handleLeaveCall} meetingName={meetingName} />}
      {show === 'ended' && <CallEnded />}
    </StreamTheme>
  );
};
