/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { SimpleSelect } from '~/components/form/SimpleSelect';

import { useFieldContext } from '../_util/form';
import { TextInput } from '~/components/form/TextInput';
import type { SelectOption } from '../_util/schema';

export type TextOrSelectField = {
  options?: SelectOption[];
  label: string;
  selectPlaceholder: string;
  textPlaceholder: string;
  required?: boolean;
};

export function TextOrSelectField(props: TextOrSelectField) {
  const field = useFieldContext<string>();
  const shouldDisplayError = (field.state.meta.isDirty || field.state.meta.isValidating) && !field.state.meta.isValid;
  const errorMessage = field.state.meta.errors?.[0]?.message as string;
  return (
    <>
      {props.options && (
        <SimpleSelect
          name={field.name}
          value={field.state.value}
          onChange={(value) => field.handleChange(value)}
          shouldDisplayError={shouldDisplayError}
          errorMessage={errorMessage}
          options={props.options}
          label={props.label}
          placeholder={props.selectPlaceholder}
        />
      )}
      {!props.options && (
        <TextInput
          onBlur={() => field.handleBlur()}
          name={field.name}
          value={field.state.value}
          onChange={(e) => field.handleChange(e.target.value)}
          shouldDisplayError={shouldDisplayError}
          errorMessage={errorMessage}
          label={props.label}
          placeholder={props.textPlaceholder}
        />
      )}
    </>
  );
}
