import React, { useState, useCallback, ReactElement } from 'react';
import { useHistory } from 'react-router-dom';
import notify from 'devextreme/ui/notify';
import LoadIndicator from 'devextreme-react/load-indicator';
import { useMSALAuth } from '../../contexts/msal-auth';
import { LoadPanel } from 'devextreme-react/load-panel';

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
    <div className="login-container">
      <LoadPanel
        position={{ of: '.app-main-content' }}
        visible={loading}
        showIndicator={true}
        shading={true}
        shadingColor="rgba(0,0,0,0.1)"
        showPane={true}
      />
      
      <div className="login-form">
        <button
          type="button"
          className="microsoft-login-button"
          onClick={handleMicrosoftLogin}
          disabled={loading}
          aria-label="Sign in with Microsoft"
        >
            <span className="microsoft-icon">
              {/* Microsoft logo SVG */}
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 21 21">
                <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
              </svg>
            </span>
            <span className="button-text">
              {loading ? (
                <>
                  <LoadIndicator width={'18px'} height={'18px'} visible={true} />
                  <span style={{ marginLeft: '8px' }}>Signing in...</span>
                </>
              ) : (
                'Continue with Microsoft'
              )}
            </span>
        </button>
        
        <div className="skip-login">
          <a>Using SPM requires a valid Microsoft account</a>
        </div>
      </div>
    </div>
  );
}
