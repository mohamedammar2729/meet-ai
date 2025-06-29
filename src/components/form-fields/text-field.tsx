

import { IFormField } from "@/types/app";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { ValidationErrors } from "@/validations/auth";

interface Props extends IFormField {
  error: ValidationErrors;
}

const TextField = ({
  label,
  name,
  type,
  placeholder,
  disabled,
  autoFocus,
  error,
  defaultValue,
  readOnly,
}: Props) => {
  return (
    <div className='space-y-2'>
      <Label
        htmlFor={name}
        className={`capitalize mb-2 ${
          error && error[name] ? 'text-destructive' : 'text-black'
        }`}
      >
        {label}
      </Label>
      <Input
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        name={name}
        id={name}
        defaultValue={defaultValue}
        readOnly={readOnly}
        aria-invalid={!!(error && error[name])}
      />
      {error?.[name] && (
        <p className='text-destructive mt-2 text-sm font-medium'>
          {Array.isArray(error[name]) ? error[name][0] : error[name]}
        </p>
      )}
    </div>
  );
};

export default TextField;
