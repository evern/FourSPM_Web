import React, { useState, useRef, useCallback, ReactElement, FormEvent } from 'react';
import { Link, useHistory } from 'react-router-dom';
import Form, {
  Item,
  Label,
  ButtonItem,
  ButtonOptions,
  RequiredRule,
  EmailRule
} from 'devextreme-react/form';
import LoadIndicator from 'devextreme-react/load-indicator';
import notify from 'devextreme/ui/notify';
import { useAuth } from '../../contexts/auth';
import defaultUser from '../../utils/default-user';

import './login-form.scss';

interface FormData {
  email?: string;
  password?: string;
  rememberMe?: boolean;
}

interface EditorOptions {
  stylingMode?: string;
  placeholder?: string;
  mode?: string;
  text?: string;
  elementAttr?: {
    class: string;
  };
}

export default function LoginForm(): ReactElement {
  const history = useHistory();
  const { signIn } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const formData = useRef<FormData>({
    email: defaultUser.email,
    password: 'password',
    rememberMe: false
  });

  const onSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    const { email, password } = formData.current;
    setLoading(true);

    if (email && password) {
      const result = await signIn(email, password);
      if (!result.isOk) {
        setLoading(false);
        notify(result.message, 'error', 2000);
      }
    }
  }, [signIn]);

  const onCreateAccountClick = useCallback(() => {
    history.push('/create-account');
  }, [history]);

  return (
    <form className={'login-form'} onSubmit={onSubmit}>
      <Form formData={formData.current} disabled={loading}>
        <Item
          dataField={'email'}
          editorType={'dxTextBox'}
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
          dataField={'rememberMe'}
          editorType={'dxCheckBox'}
          editorOptions={rememberMeEditorOptions}
        >
          <Label visible={false} />
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
                  : 'Sign In'
              }
            </span>
          </ButtonOptions>
        </ButtonItem>
        <Item>
          <div className={'link'}>
            <Link to={'/reset-password'}>Forgot password?</Link>
          </div>
        </Item>
        <ButtonItem>
          <ButtonOptions
            text={'Create an account'}
            width={'100%'}
            onClick={onCreateAccountClick}
          />
        </ButtonItem>
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

const rememberMeEditorOptions: EditorOptions = { 
  text: 'Remember me', 
  elementAttr: { 
    class: 'form-text' 
  } 
};
