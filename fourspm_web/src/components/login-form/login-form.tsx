import React, { useState, useCallback, ReactElement } from 'react';
import { useHistory } from 'react-router-dom';
import notify from 'devextreme/ui/notify';
import LoadIndicator from 'devextreme-react/load-indicator';
import { useMSALAuth } from '../../contexts/msal-auth';

import './login-form.scss';

interface MicrosoftLoginButtonProps {
  className?: string;
}

export default function LoginForm(): ReactElement {
  const history = useHistory();
  const { signIn, signInWithRole } = useMSALAuth();
  const [loading, setLoading] = useState<boolean>(false);

  const handleMicrosoftLogin = useCallback(async () => {
    try {
      setLoading(true);
      // Use signInWithRole for admin access, or signIn for regular user access
      const result = await signIn();
      
      if (!result.isOk) {
        notify(result.message || 'Login failed', 'error', 3500);
      }
    } catch (error) {
      notify('Authentication failed. Please try again.', 'error', 3500);
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  }, [signIn]);

  return (
    <div className="login-form">
      <div className="login-header">
        <h2>Sign in to FourSPM</h2>
        <p>Use your Microsoft account to access the application</p>
      </div>
      
      <button
        type="button"
        className="microsoft-login-button"
        onClick={handleMicrosoftLogin}
        disabled={loading}
        aria-label="Sign in with Microsoft"
      >
        <span className="microsoft-icon">
          {/* Microsoft logo SVG */}
          <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 21 21">
            <rect x="1" y="1" width="9" height="9" fill="#f25022" />
            <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
            <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
            <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
          </svg>
        </span>
        <span className="button-text">
          {loading ? (
            <>
              <LoadIndicator width={'20px'} height={'20px'} visible={true} />
              <span style={{ marginLeft: '8px' }}>Signing in...</span>
            </>
          ) : (
            'Sign in with Microsoft'
          )}
        </span>
      </button>
      
      <div className="login-footer">
        <p>Using FourSPM requires a valid Microsoft account with appropriate permissions</p>
      </div>
    </div>
  );
}
