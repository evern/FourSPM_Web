import React, { useState, useRef, useCallback, ReactElement, FormEvent } from 'react';
import { Link, useHistory } from "react-router-dom";
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
import { resetPassword } from '../../api/auth';
import './reset-password-form.scss';

interface FormData {
  email?: string;
}

interface EditorOptions {
  stylingMode: string;
  placeholder: string;
  mode: string;
}

interface ButtonAttributes {
  class: string;
}

const notificationText = 'We\'ve sent a link to reset your password. Check your inbox.';

export default function ResetPasswordForm(): ReactElement {
  const history = useHistory();
  const [loading, setLoading] = useState<boolean>(false);
  const formData = useRef<FormData>({});

  const onSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    const { email } = formData.current;
    setLoading(true);

    if (email) {
      const result = await resetPassword(email);
      setLoading(false);

      if (result.isOk) {
        history.push('/login');
        notify(notificationText, 'success', 2500);
      } else {
        notify(result.message, 'error', 2000);
      }
    }
  }, [history]);

  return (
    <form className={'reset-password-form'} onSubmit={onSubmit}>
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
        <ButtonItem>
          <ButtonOptions
            elementAttr={submitButtonAttributes}
            width={'100%'}
            type={'default'}
            useSubmitBehavior={true}
          >
            <span className="dx-button-text">
              {
                loading
                  ? <LoadIndicator width={'24px'} height={'24px'} visible={true} />
                  : 'Reset my password'
              }
            </span>
          </ButtonOptions>
        </ButtonItem>
        <Item>
          <div className={'login-link'}>
            Return to <Link to={'/login'}>Sign In</Link>
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

const submitButtonAttributes: ButtonAttributes = { 
  class: 'submit-button' 
};
