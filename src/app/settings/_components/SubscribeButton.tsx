import { useState } from 'react';
import { useFormContext } from '../_util/form';
import { Button } from '~/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/Dialog';

export interface SubscribeButtonProps {
  label: string;
  className?: string;
}

export function SubscribeButton({ label, className }: SubscribeButtonProps) {
  const form = useFormContext();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleSaveClick = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirm = () => {
    setShowConfirmDialog(false);
    form.handleSubmit();
  };

  const handleCancel = () => {
    setShowConfirmDialog(false);
  };

  return (
    <>
      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
        {([canSubmit, isSubmitting]) => (
          <Button
            type="button"
            disabled={!canSubmit}
            className={className}
            onClick={handleSaveClick}
          >
            {isSubmitting ? '...' : label}
          </Button>
        )}
      </form.Subscribe>
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Save</DialogTitle>
            <DialogDescription>
              Are you sure you want to save these settings? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="button" onClick={handleConfirm}>
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
