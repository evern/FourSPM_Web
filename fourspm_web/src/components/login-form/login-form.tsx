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
import { useAuth } from '../../auth';
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
    setLoading(true);

    try {
      // Trigger Azure AD SSO authentication popup
      const result = await signIn();
      
      // Type guard to handle the union return type (boolean | { isOk: boolean, ... })
      if (typeof result === 'object' && 'isOk' in result) {
        // Legacy object return type with isOk property
        if (!result.isOk) {
          setLoading(false);
          notify(result.message || 'Authentication failed', 'error', 2000);
        }
      } else if (result === false) {
        // New boolean return type - false indicates error
        setLoading(false);
        notify('Authentication failed', 'error', 2000);
      }
    } catch (error) {
      setLoading(false);
      notify('Authentication failed: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error', 3000);
    }
  }, [signIn]);

  const onCreateAccountClick = useCallback(() => {
    history.push('/create-account');
  }, [history]);

  return (
    <form className={'login-form'} onSubmit={onSubmit}>
      <div className="login-header">
        <h3>Sign in with Microsoft</h3>
        <p>Use your Microsoft account to access FourSPM</p>
      </div>
      <Form formData={formData.current} disabled={loading}>
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
                  : 'Sign in with Microsoft'
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
