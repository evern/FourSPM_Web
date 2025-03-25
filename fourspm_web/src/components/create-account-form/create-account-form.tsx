import React, { useState, useRef, useCallback, ReactElement, FormEvent } from 'react';
import { Link, useHistory } from 'react-router-dom';
import Form, {
  Item,
  Label,
  ButtonItem,
  ButtonOptions,
  RequiredRule,
  CustomRule,
  EmailRule
} from 'devextreme-react/form';
import notify from 'devextreme/ui/notify';
import LoadIndicator from 'devextreme-react/load-indicator';
import { createAccount } from '../../api/auth-api.service';
import './create-account-form.scss';

interface FormData {
  email?: string;
  password?: string;
  confirmedPassword?: string;
  firstName?: string;
  lastName?: string;
}

interface EditorOptions {
  stylingMode: string;
  placeholder: string;
  mode?: string;
}

interface ValidationCallbackData {
  value: string;
}

export default function CreateAccountForm(): ReactElement {
  const history = useHistory();
  const [loading, setLoading] = useState<boolean>(false);
  const formData = useRef<FormData>({});

  const onSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    const { email, password, firstName, lastName } = formData.current;
    setLoading(true);

    if (email && password) {
      const result = await createAccount(email, password, firstName, lastName);
      setLoading(false);

      if (result.isOk) {
        history.push('/login');
      } else {
        notify(result.message, 'error', 2000);
      }
    }
  }, [history]);

  const confirmPassword = useCallback(
    ({ value }: ValidationCallbackData) => value === formData.current.password,
    []
  );

  return (
    <form className={'create-account-form'} onSubmit={onSubmit}>
      <Form formData={formData.current} disabled={loading}>
        <Item
          dataField={'firstName'}
          editorOptions={firstNameEditorOptions}
        >
          <RequiredRule message="First Name is required" />
          <Label visible={false} />
        </Item>
        <Item
          dataField={'lastName'}
          editorOptions={lastNameEditorOptions}
        >
          <RequiredRule message="Last Name is required" />
          <Label visible={false} />
        </Item>
        <Item
          dataField={'email'}
          editorOptions={emailEditorOptions}
        >
          <RequiredRule message="Email is required" />
          <EmailRule message="Email is invalid" />
          <Label visible={false} />
        </Item>
        <Item
          dataField={'password'}
          editorType={'dxTextBox'}
          editorOptions={passwordEditorOptions}
        >
          <RequiredRule message="Password is required" />
          <Label visible={false} />
        </Item>
        <Item
          dataField={'confirmedPassword'}
          editorType={'dxTextBox'}
          editorOptions={confirmedPasswordEditorOptions}
        >
          <RequiredRule message="Password confirmation is required" />
          <CustomRule
            message={'Passwords do not match'}
            validationCallback={confirmPassword}
          />
          <Label visible={false} />
        </Item>
        <Item>
          <div className='policy-info'>
            By creating an account, you agree to the <Link to="#">Terms of Service</Link> and <Link to="#">Privacy Policy</Link>
          </div>
        </Item>
        <ButtonItem>
          <ButtonOptions
            width={'100%'}
            type={'default'}
            useSubmitBehavior={true}
          >
            <span className="dx-button-text">
              {
                loading
                  ? <LoadIndicator width={'24px'} height={'24px'} visible={true} />
                  : 'Create a new account'
              }
            </span>
          </ButtonOptions>
        </ButtonItem>
        <Item>
          <div className={'login-link'}>
            Have an account? <Link to={'/login'}>Sign In</Link>
          </div>
        </Item>
      </Form>
    </form>
  );
}

const emailEditorOptions: EditorOptions = { 
  stylingMode: 'filled', 
  placeholder: 'Email', 
  mode: 'email' 
};

const passwordEditorOptions: EditorOptions = {
  stylingMode: 'filled',
  placeholder: 'Password',
  mode: 'password'
};

const confirmedPasswordEditorOptions: EditorOptions = {
  stylingMode: 'filled',
  placeholder: 'Confirm Password',
  mode: 'password'
};

const firstNameEditorOptions: EditorOptions = {
  stylingMode: 'filled',
  placeholder: 'First Name'
};

const lastNameEditorOptions: EditorOptions = {
  stylingMode: 'filled',
  placeholder: 'Last Name'
};
