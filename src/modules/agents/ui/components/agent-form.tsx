'use client';
import { useTRPC } from '@/trpc/client';
import { AgentGetOne } from '../../types';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { agentsInsertSchema } from '../../schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { GeneratedAvatar } from '@/components/generated-avatar';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface AgentFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialValues?: AgentGetOne;
}

export const AgentForm = ({
  onSuccess,
  onCancel,
  initialValues,
}: AgentFormProps) => {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();

  const createAgent = useMutation(
    trpc.agents.create.mutationOptions({
      onSuccess: async () => {
        // trpc.agents.getMany.queryOptions() returns the query options for the getMany procedure
        // this is used to refetch the list of agents after creating a new agent
        await queryClient.invalidateQueries(
          trpc.agents.getMany.queryOptions({})
        );
        await queryClient.invalidateQueries(
          trpc.premium.getFreeUsage.queryOptions()
        );
        // if onSuccess is provided, call it
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.message);
        //TODO: Check if the error code is `FORBIDDEN`, redirect to "/upgrade"
        if (error.data?.code === 'FORBIDDEN') {
          // Redirect to the upgrade page
          router.push('/upgrade');
        }
      },
    })
  );

  const updateAgent = useMutation(
    trpc.agents.update.mutationOptions({
      onSuccess: async () => {
        // Invalidate the queries to refetch the data
        await queryClient.invalidateQueries(
          trpc.agents.getMany.queryOptions({})
        );
        // If we are editing an existing agent, we need to refetch the agent details
        // to update the agent details in the list
        if (initialValues?.id) {
          // Invalidate the query for the specific agent
          // to ensure the updated data is fetched
          queryClient.invalidateQueries(
            trpc.agents.getOne.queryOptions({ id: initialValues.id })
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

  const form = useForm<z.infer<typeof agentsInsertSchema>>({
    resolver: zodResolver(agentsInsertSchema),
    defaultValues: {
      name: initialValues?.name || '',
      instructions: initialValues?.instructions || '',
    },
  });
  // isEdit is used to determine if the form is in edit mode or create mode
  const isEdit = !!initialValues?.id;
  // isPending is used to determine if the mutation is pending
  // it is used to disable the form while the mutation is in progress
  const isPending = createAgent.isPending || updateAgent.isPending;

  const onSubmit = async (data: z.infer<typeof agentsInsertSchema>) => {
    if (isEdit) {
      updateAgent.mutate({
        ...data,
        id: initialValues?.id, // Ensure id is provided for update
      });
    } else {
      createAgent.mutate(data);
    }
  };

  return (
    <Form {...form}>
      {/* we used form.handleSubmit because if there is any wrong in form prevent onSubmit to call */}
      <form className='space-y-4' onSubmit={form.handleSubmit(onSubmit)}>
        <GeneratedAvatar
          seed={form.watch('name') || 'New Agent'}
          variant='botttsNeutral'
          className='border size-16'
        />
        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder='Enter agent name' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='instructions'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Instructions</FormLabel>
              <FormControl>
                <Textarea
                  placeholder='You are a helpful math assistant that can answer questions and help with assignments.'
                  {...field}
                />
              </FormControl>
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
  );
};

// One of advantages of using tanstack/react-query to has revalidateQueries
// which we can use to revalidate the data automaticly after mutation while data is still in the cache.

// But if we load the data in the server component and then passed as Props to the client component,
// we can not revalidate the data automatically
