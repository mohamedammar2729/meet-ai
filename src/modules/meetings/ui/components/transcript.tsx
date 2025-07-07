'use client';
import { useState } from 'react';
import { format } from 'date-fns';
import { SearchIcon } from 'lucide-react';
import Highlighter from 'react-highlight-words';
import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@/trpc/client';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { generateAvatarUri } from '@/lib/avatar';

interface Props {
  meetingId: string;
}

export const Transcript = ({ meetingId }: Props) => {
  const trpc = useTRPC();
  const { data } = useQuery(
    trpc.meetings.getTranscript.queryOptions({ id: meetingId })
  );
  const [searchQuery, setSearchQuery] = useState('');
  const filterData = (data ?? []).filter((item) =>
    item.text.toString().toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className='bg-white rounded-lg border px-4 py-5 flex flex-col gap-y-4 w-full'>
      <p className='text-sm font-medium'>Transcript</p>
      <div className='relative'>
        <Input
          placeholder='SearchTranscript'
          className='pl-7 h-9 w-[240px]'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <SearchIcon className='size-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground' />
      </div>
      <ScrollArea className='h-[500px]'>
        <div className='flex flex-col gap-y-4'>
          {filterData.map((item) => {
            return (
              <div
                key={item.start_ts}
                className='flex flex-col gap-y-2 rounded-md hover:bg-muted p-4 border '
              >
                <div className='flex gap-x-2 items-center'>
                  <Avatar className='size-6'>
                    <AvatarImage
                      src={
                        item.user.image ??
                        generateAvatarUri({
                          seed: item.user.name,
                          variant: 'initials',
                        })
                      }
                      alt='User Avatar'
                    />
                  </Avatar>
                  <p className='text-sm font-medium'>{item.user.name}</p>
                  <p className='text-xs font-medium text-blue-500'>
                    {format(new Date(0, 0, 0, 0, 0, 0, item.start_ts), 'mm:ss')}
                  </p>
                </div>
                <Highlighter
                  highlightClassName='bg-yellow-200'
                  className='text-sm text-neutral-700'
                  searchWords={[searchQuery]}
                  autoEscape={true}
                  textToHighlight={item.text}
                />
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};
