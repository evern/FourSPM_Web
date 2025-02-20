import React, { useState, useRef, useCallback, ReactElement, FormEvent } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import Form, {
  Item,
  Label,
  ButtonItem,
  ButtonOptions,
  RequiredRule,
  CustomRule,
} from 'devextreme-react/form';
import LoadIndicator from 'devextreme-react/load-indicator';
import notify from 'devextreme/ui/notify';
import { changePassword } from '../../api/auth';

interface FormData {
  password?: string;
  confirmedPassword?: string;
}

interface EditorOptions {
  stylingMode: string;
  placeholder: string;
  mode: string;
}

interface ValidationCallbackData {
  value: string;
}

interface RouteParams {
  recoveryCode: string;
}

export default function ChangePasswordForm(): ReactElement {
  const history = useHistory();
  const [loading, setLoading] = useState<boolean>(false);
  const formData = useRef<FormData>({});
  const { recoveryCode } = useParams<RouteParams>();

  const onSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    const { password } = formData.current;
    setLoading(true);

    if (password) {
      const result = await changePassword(password, recoveryCode);
      setLoading(false);

      if (result.isOk) {
        history.push('/login');
      } else {
        notify(result.message, 'error', 2000);
      }
    }
  }, [history, recoveryCode]);

  const confirmPassword = useCallback(
    ({ value }: ValidationCallbackData): boolean => 
      value === formData.current.password,
    []
  );

  return (
    <form onSubmit={onSubmit}>
      <Form formData={formData.current} disabled={loading}>
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
          <RequiredRule message="Password is required" />
          <CustomRule
            message={'Passwords do not match'}
            validationCallback={confirmPassword}
          />
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
                  : 'Continue'
              }
            </span>
          </ButtonOptions>
        </ButtonItem>
      </Form>
    </form>
  );
}

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
