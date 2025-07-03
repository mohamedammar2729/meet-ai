'use client';
import { useTRPC } from '@/trpc/client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { MeetingGetOne } from '../../types';
import { meetingsInsertSchema } from '../../schemas';
import { useState } from 'react';
import { CommandSelect } from '@/components/command-select';
import { GeneratedAvatar } from '@/components/generated-avatar';
import { NewAgentDialog } from '@/modules/agents/ui/components/new-agent-dialog';

interface MeetingFormProps {
  onSuccess?: (id?: string) => void;
  onCancel?: () => void;
  initialValues?: MeetingGetOne;
}

export const MeetingForm = ({
  onSuccess,
  onCancel,
  initialValues,
}: MeetingFormProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [agentSearch, setAgentSearch] = useState('');
  const [openNewAgentDialog, setOpenNewAgentDialog] = useState(false);

  const agents = useQuery(
    trpc.agents.getMany.queryOptions({
      pageSize: 100, // Adjust as needed
      search: agentSearch, // Use the search term from state
    })
  );

  const createMeeting = useMutation(
    trpc.meetings.create.mutationOptions({
      onSuccess: async (data) => {
        // trpc.meetings.getMany.queryOptions() returns the query options for the getMany procedure
        // this is used to refetch the list of meetings after creating a new meeting
        await queryClient.invalidateQueries(
          trpc.meetings.getMany.queryOptions({})
        );
        // if onSuccess is provided, call it
        onSuccess?.(data.id);
      },
      onError: (error) => {
        toast.error(error.message);
        //TODO: Check if the error code is `FORBIDDEN`, redirect to "/upgrade"
      },
    })
  );

  const updateMeeting = useMutation(
    trpc.meetings.update.mutationOptions({
      onSuccess: async () => {
        // Invalidate the queries to refetch the data
        await queryClient.invalidateQueries(
          trpc.meetings.getMany.queryOptions({})
        );
        // If we are editing an existing meeting, we need to refetch the meeting details
        // to update the meeting details in the list
        if (initialValues?.id) {
          // Invalidate the query for the specific meeting
          // to ensure the updated data is fetched
          queryClient.invalidateQueries(
            trpc.meetings.getOne.queryOptions({ id: initialValues.id })
          );
        }
        // If onSuccess is provided, call it
        // This is useful to close the dialog or redirect the user
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const form = useForm<z.infer<typeof meetingsInsertSchema>>({
    resolver: zodResolver(meetingsInsertSchema),
    defaultValues: {
      name: initialValues?.name || '',
      agentId: initialValues?.agentId || '',
    },
  });
  // isEdit is used to determine if the form is in edit mode or create mode
  const isEdit = !!initialValues?.id;
  // isPending is used to determine if the mutation is pending
  // it is used to disable the form while the mutation is in progress
  const isPending = createMeeting.isPending || updateMeeting.isPending;

  const onSubmit = async (data: z.infer<typeof meetingsInsertSchema>) => {
    if (isEdit) {
      updateMeeting.mutate({
        ...data,
        id: initialValues?.id, // Ensure id is provided for update
      });
    } else {
      createMeeting.mutate(data);
    }
  };

  return (
    <>
      <NewAgentDialog
        open={openNewAgentDialog}
        onOpenChange={setOpenNewAgentDialog}
      />
      <Form {...form}>
        {/* we used form.handleSubmit because if there is any wrong in form prevent onSubmit to call */}
        <form className='space-y-4' onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name='name'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder='Enter meeting name e.g. Math Consultations'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='agentId'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Agent</FormLabel>
                <FormControl>
                  <CommandSelect
                    options={(agents.data?.items ?? []).map((agent) => ({
                      id: agent.id,
                      value: agent.id,
                      children: (
                        <div className='flex items-center gap-x-2'>
                          <GeneratedAvatar
                            seed={agent.name}
                            variant='botttsNeutral'
                            className='border size-6'
                          />
                          <span>{agent.name}</span>
                        </div>
                      ),
                    }))}
                    onSelect={field.onChange}
                    onSearch={setAgentSearch}
                    value={field.value}
                    placeholder='Select an agent'
                  />
                </FormControl>
                <FormDescription>
                  Not found what you&apos;re looking for?{' '}
                  <button
                    type='button'
                    className='text-primary hover:underline'
                    onClick={() => setOpenNewAgentDialog(true)}
                  >
                    Create a new agent
                  </button>
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className='flex justify-between gap-x-2'>
            {onCancel && (
              <Button
                variant='ghost'
                onClick={() => onCancel()}
                type='button'
                disabled={isPending}
              >
                Cancel
              </Button>
            )}
            <Button type='submit' disabled={isPending}>
              {isEdit ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
};

// One of advantages of using tanstack/react-query to has revalidateQueries
// which we can use to revalidate the data automaticly after mutation while data is still in the cache.

// But if we load the data in the server component and then passed as Props to the client component,
// we can not revalidate the data automatically
