/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { useFieldContext } from '../_util/form';
import { TextInput } from '~/components/form/TextInput';

export interface TextFieldProps {
  label: string;
  placeholder: string;
  required?: boolean;
}

export function TextField({ label, placeholder, required = false }: TextFieldProps) {
  const field = useFieldContext<string>();
  const hasError = (field.state.meta.isDirty || field.state.meta.isValidating) && !field.state.meta.isValid;
  return (
    <TextInput
      name={field.name}
      value={field.state.value}
      onChange={(e) => field.handleChange(e.target.value)}
      onBlur={() => field.handleBlur()}
      label={label}
      placeholder={placeholder}
      required={required}
      shouldDisplayError={hasError}
      errorMessage={field.state.meta.errors?.[0]?.message as string}
    />
  );
}
