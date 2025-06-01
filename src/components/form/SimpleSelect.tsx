import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/Select';
import type { SelectOption } from '../../app/settings/_util/schema';
import { Label } from '~/components/ui/Label';
import { cn } from '~/lib/utils';

export interface SimpleSelectProps {
  name: string;
  options: SelectOption[];
  label: string;
  placeholder: string;
  className?: string;
  onChange: (value: string) => void;
  value: string;
  shouldDisplayError?: boolean;
  errorMessage?: string;
  required?: boolean;
  wrapperProps?: React.HTMLAttributes<HTMLDivElement>;
  labelProps?: React.ComponentProps<typeof Label>;
  selectProps?: React.ComponentProps<typeof Select>;
  errorProps?: React.HTMLAttributes<HTMLDivElement>;
}
export function SimpleSelect({
  name,
  options,
  label,
  className,
  placeholder,
  onChange,
  value,
  shouldDisplayError,
  errorMessage,
  selectProps,
  labelProps,
  wrapperProps,
  errorProps,
  required,
}: SimpleSelectProps) {
  return (
    <>
      <div className={cn('mb-1 flex items-center gap-2', className)} {...wrapperProps}>
        <Label className="min-w-[120px]" {...labelProps}>
          {label}
        </Label>
        <Select required={required} name={name} onValueChange={onChange} value={value} {...selectProps}>
          <SelectTrigger className={cn('w-full', shouldDisplayError && 'border-red-500 focus:ring-red-500')}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>{label}</SelectLabel>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      {shouldDisplayError && (
        <div role="alert" className="text-destructive mb-1 font-medium" {...errorProps}>
          {errorMessage}
        </div>
      )}
    </>
  );
}
