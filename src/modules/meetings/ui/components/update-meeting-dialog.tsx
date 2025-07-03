import { ResponsiveDialog } from '@/components/responsive-dialog';
import { AgentForm } from './meeting-form';

import { AgentGetOne } from '../../types';

interface NewAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: AgentGetOne;
}

export const UpdateAgentDialog = ({
  open,
  onOpenChange,
  initialValues,
}: NewAgentDialogProps) => {
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Edit Agent'
      description='Edit the agent details'
    >
      <AgentForm
        onSuccess={() => onOpenChange(false)}
        onCancel={() => onOpenChange(false)}
        initialValues={initialValues}
      />
    </ResponsiveDialog>
  );
};
