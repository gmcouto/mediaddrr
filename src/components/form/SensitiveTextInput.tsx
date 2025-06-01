import { useState } from 'react';
import { Input } from '~/components/ui/Input';
import { Label } from '~/components/ui/Label';
import { cn } from '~/lib/utils';
import { Toggle } from '../ui/Toggle';

export interface SensitiveTextInputProps {
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  label: string;
  placeholder: string;
  required?: boolean;
  toggleHideLabel: string;
  toggleShowLabel: string;
  hidePasswordMessage: string;
  showPasswordMessage: string;
  shouldDisplayError?: boolean;
  errorMessage?: string;
  wrapperProps?: React.HTMLAttributes<HTMLDivElement>;
  labelProps?: React.ComponentProps<typeof Label>;
  inputProps?: React.ComponentProps<typeof Input>;
  errorProps?: React.HTMLAttributes<HTMLDivElement>;
}

export function SensitiveTextInput({
  label,
  placeholder,
  required = false,
  toggleHideLabel,
  toggleShowLabel,
  hidePasswordMessage,
  showPasswordMessage,
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
}: SensitiveTextInputProps) {
  const [showPassword, setShowPassword] = useState<boolean>(false);

  return (
    <>
      <div className="mb-1 flex items-center gap-2" {...wrapperProps}>
        <Label htmlFor={name} className="min-w-[120px]" {...labelProps}>
          {label}
        </Label>
        <div className="flex flex-1 items-center gap-2">
          <Input
            type={showPassword ? 'text' : 'password'}
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
          <Toggle
            aria-label={showPassword ? showPasswordMessage : hidePasswordMessage}
            pressed={showPassword}
            onPressedChange={(pressed) => setShowPassword(pressed)}
            variant="outline"
            size="sm"
          >
            {showPassword ? toggleHideLabel : toggleShowLabel}
          </Toggle>
        </div>
      </div>
      {shouldDisplayError && (
        <div role="alert" className="text-destructive mb-1 font-medium" {...errorProps}>
          {errorMessage}
        </div>
      )}
    </>
  );
}
