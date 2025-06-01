import { useFormContext } from '../_util/form';
import { Button } from '~/components/ui/Button';

export interface SubscribeButtonProps {
  label: string;
  className?: string;
}

export function SubscribeButton({ label, className }: SubscribeButtonProps) {
  const form = useFormContext();
  return (
    <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
      {([canSubmit, isSubmitting]) => (
        <Button type="submit" disabled={!canSubmit} className={className} onClick={() => form.handleSubmit()}>
          {isSubmitting ? '...' : label}
        </Button>
      )}
    </form.Subscribe>
  );
}
