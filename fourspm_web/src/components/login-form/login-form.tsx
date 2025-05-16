import React, { useState, useCallback, useEffect } from 'react';
import { useHistory, useLocation, Link } from 'react-router-dom';
import LoadIndicator from 'devextreme-react/load-indicator';
import Button from 'devextreme-react/button';
import notify from 'devextreme/ui/notify';
import './login-form.scss';
import { useAuth } from '../../auth/auth-context';
import { useMsal } from '@azure/msal-react';

// Import microsoft logo as a static asset
import microsoftLogo from '../../assets/microsoft-logo.svg';

export default function LoginForm() {
  const { user, loading, signIn } = useAuth();
  const history = useHistory();
  const location = useLocation();
  const { accounts } = useMsal();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [autoLoginAttempted, setAutoLoginAttempted] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  
  /**
   * Check if we should attempt silent login based on query parameters
   * This is useful when users are redirected back after token acquisition
   */
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const autoLogin = searchParams.get('silentLogin') === 'true';
    const redirectPath = searchParams.get('redirectTo') || '/';
    
    // Only attempt auto-login if it's requested and we haven't tried yet
    if (autoLogin && !autoLoginAttempted && !user && accounts.length > 0) {
      setAutoLoginAttempted(true);
      setIsAuthenticating(true);
      
      // Attempt to sign in silently
      signIn()
        .then(result => {
          if (result.isOk) {
            // Redirect to the requested path if login was successful
            history.push(redirectPath);
            
            notify({
              message: 'Welcome back!',
              type: 'success',
              displayTime: 2000,
              position: { at: 'top center', my: 'top center' }
            });
          }
        })
        .catch(error => {
          console.error('Silent authentication failed:', error);
          // We don't show errors for silent auth failures
        })
        .finally(() => {
          setIsAuthenticating(false);
        });
    }
  }, [accounts, autoLoginAttempted, history, location.search, signIn, user]);

  /**
   * Handle Microsoft sign-in button click with enhanced error handling
   */
  const handleMicrosoftSignIn = useCallback(async () => {
    try {
      setIsAuthenticating(true);
      setLoginError(null);
      
      const result = await signIn();
      
      if (result.isOk) {
        // Login successful, auth context has already shown success notification
        
        // Redirect to home or last known route if available
        const redirectPath = sessionStorage.getItem('lastPath') || '/';
        if (redirectPath !== '/login') {
          history.push(redirectPath);
        }
      } else {
        // Handle login error - the auth context already shows notifications,
        // but we'll also update our local state for UI feedback
        setLoginError(result.message || 'Authentication failed');
        
        // If there are error details, we can provide more specific UI feedback
        if (result.errorDetails?.category) {
          switch (result.errorDetails.category) {
            case 'popup_blocked':
              // Show special message for popup blocked
              setLoginError('The login popup was blocked by your browser. Please enable popups for this site and try again.');
              break;
              
            case 'network_error':
              // Show offline message
              setLoginError('Unable to connect to authentication service. Please check your internet connection and try again.');
              break;
              
            case 'user_cancelled':
              // User cancelled the login, just clear the error
              setLoginError(null);
              break;
              
            // Other categories can be handled as needed
          }
        }
      }
    } catch (error) {
      // Handle unexpected errors not caught by auth context
      console.error('Unhandled login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown authentication error';
      setLoginError(errorMessage);
      
      notify({
        message: 'An unexpected error occurred during sign in. Please try again.',
        type: 'error',
        displayTime: 3000,
        position: { at: 'top center', my: 'top center' }
      });
    } finally {
      setIsAuthenticating(false);
    }
  }, [signIn, history]);

  /**
   * Navigate to create account page
   */
  const onCreateAccountClick = useCallback(() => {
    history.push('/create-account');
  }, [history]);

  /**
   * Render Microsoft sign-in button with appropriate styling
   */
  const renderMicrosoftButton = () => (
    <Button
      className='microsoft-login-button'
      onClick={handleMicrosoftSignIn}
      disabled={isAuthenticating || loading}
      stylingMode='contained'
      type='default'
      width='100%'
      height='44px'
    >
      <div className='button-content'>
        <img src={microsoftLogo} alt='Microsoft logo' className='ms-logo' />
        <span className='button-text'>
          {isAuthenticating ? (
            <>
              <LoadIndicator width={'18px'} height={'18px'} visible={true} className='login-loader' />
              Signing in...
            </>
          ) : (
            'Sign in with Microsoft'
          )}
        </span>
      </div>
    </Button>
  );

  return (
    <div className='login-form'>
      <div className='login-header'>
        <h3>Welcome to FourSPM</h3>
        <p className='login-description'>Sign in with your corporate Microsoft account</p>
      </div>
      
      {loginError && (
        <div className='login-error-message'>
          {loginError}
        </div>
      )}
      
      <div className='form-group'>
        {renderMicrosoftButton()}
      </div>
      
      <div className='login-separator'>
        <span className='separator-text'>or</span>
      </div>
      
      <div className='form-group'>
        <Button
          text='Create an account'
          onClick={onCreateAccountClick}
          stylingMode='outlined'
          type='normal'
          width='100%'
        />
      </div>
      
      <div className='form-group login-links'>
        <Link to='/reset-password' className='forgot-link'>Forgot password?</Link>
        <Link to='/' className='help-link'>Need help?</Link>
      </div>
    </div>
  );
}
