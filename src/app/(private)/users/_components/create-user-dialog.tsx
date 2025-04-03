'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CreateUserForm } from './create-user-form';

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateUserDialog = ({ open, onOpenChange }: CreateUserDialogProps) => {
  const handleSuccess = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo Usuário</DialogTitle>
        </DialogHeader>
        <div className="mt-6">
          <CreateUserForm onSuccess={handleSuccess} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export { CreateUserDialog };
