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
import { changePassword } from '../../services/auth.service';

interface FormData {
  currentPassword?: string;
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
  recoveryCode?: string;
}

interface Props {
  inProfilePage?: boolean;
}

export default function ChangePasswordForm({ inProfilePage = false }: Props): ReactElement {
  const history = useHistory();
  const [loading, setLoading] = useState<boolean>(false);
  const formData = useRef<FormData>({});
  const { recoveryCode } = useParams<RouteParams>();

  const onSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    const { password, currentPassword } = formData.current;
    setLoading(true);

    if (password) {
      const result = await changePassword(password, recoveryCode || '', currentPassword);
      setLoading(false);

      if (result.isOk) {
        if (inProfilePage) {
          notify('Password changed successfully', 'success', 2500);
        } else {
          history.push('/login');
          notify('Password changed successfully. Please login with your new password.', 'success', 2500);
        }
      } else {
        notify(result.message, 'error', 2000);
      }
    }
  }, [history, recoveryCode, inProfilePage]);

  const confirmPassword = useCallback(
    ({ value }: ValidationCallbackData): boolean => 
      value === formData.current.password,
    []
  );

  return (
    <form className={'change-password-form'} onSubmit={onSubmit}>
      <Form formData={formData.current} disabled={loading}>
        {inProfilePage && (
          <Item
            dataField={'currentPassword'}
            editorType={'dxTextBox'}
            editorOptions={currentPasswordEditorOptions}
          >
            <RequiredRule message="Current password is required" />
            <Label visible={false} />
          </Item>
        )}
        <Item
          dataField={'password'}
          editorType={'dxTextBox'}
          editorOptions={passwordEditorOptions}
        >
          <RequiredRule message="New password is required" />
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
                  : 'Change Password'
              }
            </span>
          </ButtonOptions>
        </ButtonItem>
      </Form>
    </form>
  );
}

const currentPasswordEditorOptions: EditorOptions = {
  stylingMode: 'filled',
  placeholder: 'Current Password',
  mode: 'password'
};

const passwordEditorOptions: EditorOptions = {
  stylingMode: 'filled',
  placeholder: 'New Password',
  mode: 'password'
};

const confirmedPasswordEditorOptions: EditorOptions = {
  stylingMode: 'filled',
  placeholder: 'Confirm Password',
  mode: 'password'
};
