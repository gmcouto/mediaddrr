import { Input } from '~/components/ui/Input';
import { Label } from '~/components/ui/Label';
import { cn } from '~/lib/utils';

export interface TextInputProps {
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  label: string;
  placeholder: string;
  required?: boolean;
  shouldDisplayError?: boolean;
  errorMessage?: string;
  wrapperProps?: React.HTMLAttributes<HTMLDivElement>;
  labelProps?: React.ComponentProps<typeof Label>;
  inputProps?: React.ComponentProps<typeof Input>;
  errorProps?: React.HTMLAttributes<HTMLDivElement>;
}

export function TextInput({
  label,
  placeholder,
  required = false,
  name,
  value,
  onChange,
  onBlur,
  shouldDisplayError,
  errorMessage,
  wrapperProps,
  labelProps,
  inputProps,
  errorProps,
}: TextInputProps) {
  return (
    <>
      <div className="mb-1 flex items-center gap-2" {...wrapperProps}>
        <Label htmlFor={name} className="min-w-[120px]" {...labelProps}>
          {label}
        </Label>
        <Input
          type="text"
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          className={cn('flex-1', shouldDisplayError && 'border-red-500 focus:ring-red-500')}
          required={required}
          {...inputProps}
        />
      </div>
      {shouldDisplayError && (
        <div role="alert" className="text-destructive mb-1 font-medium" {...errorProps}>
          {errorMessage}
        </div>
      )}
    </>
  );
}
