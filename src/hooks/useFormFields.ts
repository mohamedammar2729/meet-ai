import { IFormField, IFormFieldsVariables } from '@/types/app';
import { Pages } from '@/types/enums';

const useFormFields = ({ slug }: IFormFieldsVariables) => {
  const loginFields = (): IFormField[] => [
    {
      label: 'Email',
      name: 'email',
      type: 'email',
      placeholder: 'Enter your email',
      autoFocus: true,
    },
    {
      label: 'Password',
      name: 'password',
      type: 'password',
      placeholder: 'Enter your password',
    },
  ];

  const signupFields = (): IFormField[] => [
    {
      label: 'Name',
      name: 'name',
      type: 'text',
      placeholder: 'Enter your name',
      autoFocus: true,
    },
    {
      label: 'Email',
      name: 'email',
      type: 'email',
      placeholder: 'Enter your email',
    },
    {
      label: 'Password',
      name: 'password',
      type: 'password',
      placeholder: 'Enter your password',
    },
    {
      label: 'Confirm Password',
      name: 'confirmPassword',
      type: 'password',
      placeholder: 'Confirm your password',
    },
  ];

  const getFormFields = (): IFormField[] => {
    switch (slug) {
      case Pages.LOGIN:
        return loginFields();
      case Pages.Register:
        return signupFields();
      default:
        return [];
    }
  };
  return {
    getFormFields,
  };
};

export default useFormFields;
