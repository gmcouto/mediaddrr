/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { useFieldContext } from '../_util/form';
import { SensitiveTextInput } from '~/components/form/SensitiveTextInput';

export interface SensitiveTextFieldProps {
  label: string;
  placeholder: string;
  required?: boolean;
  toggleHideLabel: string;
  toggleShowLabel: string;
  hidePasswordMessage: string;
  showPasswordMessage: string;
}

export function SensitiveTextField({
  label,
  placeholder,
  toggleHideLabel,
  toggleShowLabel,
  hidePasswordMessage,
  showPasswordMessage,
  required = false,
}: SensitiveTextFieldProps) {
  const field = useFieldContext<string>();
  const hasError = (field.state.meta.isDirty || field.state.meta.isValidating) && !field.state.meta.isValid;
  return (
    <SensitiveTextInput
      label={label}
      placeholder={placeholder}
      toggleHideLabel={toggleHideLabel}
      toggleShowLabel={toggleShowLabel}
      hidePasswordMessage={hidePasswordMessage}
      showPasswordMessage={showPasswordMessage}
      required={required}
      name={field.name}
      value={field.state.value}
      onChange={(e) => field.handleChange(e.target.value)}
      onBlur={() => field.handleBlur()}
      shouldDisplayError={hasError}
      errorMessage={field.state.meta.errors?.[0]?.message as string}
    />
  );
}
