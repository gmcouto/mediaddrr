/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { useFieldContext } from '../_util/form';
import { SimpleSelect, type SimpleSelectProps } from '~/components/form/SimpleSelect';

export type SelectFieldProps = Omit<
  SimpleSelectProps,
  'name' | 'onChange' | 'value' | 'shouldDisplayError' | 'errorMessage'
>;

export function SelectField(props: SelectFieldProps) {
  const field = useFieldContext<string>();
  const shouldDisplayError = (field.state.meta.isDirty || field.state.meta.isValidating) && !field.state.meta.isValid;
  const errorMessage = field.state.meta.errors?.[0]?.message as string;
  return (
    <>
      <SimpleSelect
        {...props}
        name={field.name}
        value={field.state.value}
        onChange={(value) => field.handleChange(value)}
        shouldDisplayError={shouldDisplayError}
        errorMessage={errorMessage}
      />
    </>
  );
}
