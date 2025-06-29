
import TextField from "./text-field";
import PasswordField from "./password-field";

import { ValidationErrors } from "@/validations/auth";

import { InputTypes } from "@/types/enums";
import { IFormField } from "@/types/app";

interface Props extends IFormField {
    error: ValidationErrors;
}

const FormFields = (props: Props) => {
  const { type } = props;
  const renderField = (): React.ReactNode => {
    if (type === InputTypes.EMAIL || type === InputTypes.TEXT) {
      return <TextField {...props} />;
    }

    if (type === InputTypes.PASSWORD) {
      return <PasswordField {...props} />;
    }

    return <TextField {...props} />;
  };

  return <>{renderField()}</>;
};

export default FormFields;
