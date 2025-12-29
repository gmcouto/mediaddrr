/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { useFieldContext } from '../_util/form';
import { Input } from '~/components/ui/Input';
import { Label } from '~/components/ui/Label';
import { cn } from '~/lib/utils';

export interface ToggleNumberFieldProps {
  label: string;
  placeholder: string;
  toggleLabel: string;
  step?: string;
  defaultValue?: string;
}

export function ToggleNumberField({ label, placeholder, toggleLabel, step = 'any', defaultValue }: ToggleNumberFieldProps) {
  const field = useFieldContext<string | null>();
  const currentValue = field.state.value ?? null;
  const isEnabled = currentValue !== null;
  const hasError = (field.state.meta.isDirty || field.state.meta.isValidating) && !field.state.meta.isValid;

  const handleToggleChange = (checked: boolean) => {
    if (checked) {
      field.handleChange(defaultValue ?? '');
    } else {
      field.handleChange(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    field.handleChange(e.target.value);
  };

  const checkboxId = `toggle-${field.name}`;

  return (
    <>
      <div className="mb-1 flex items-center gap-2">
        <div className="flex min-w-[120px] items-center gap-2">
          <input
            type="checkbox"
            id={checkboxId}
            checked={isEnabled}
            onChange={(e) => {
              e.stopPropagation();
              handleToggleChange(e.target.checked);
            }}
            className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            aria-label={toggleLabel}
          />
          <Label htmlFor={checkboxId} className="cursor-pointer">
            {label}
          </Label>
        </div>
        {isEnabled && (
          <Input
            type="number"
            step={step}
            name={field.name}
            value={currentValue ?? ''}
            onChange={handleInputChange}
            onBlur={() => field.handleBlur()}
            placeholder={placeholder}
            className={cn('flex-1', hasError && 'border-red-500 focus:ring-red-500')}
          />
        )}
      </div>
      {hasError && (
        <div role="alert" className="text-destructive mb-1 font-medium">
          {field.state.meta.errors?.[0]?.message as string}
        </div>
      )}
    </>
  );
}

