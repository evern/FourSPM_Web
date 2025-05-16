import React from 'react';
import { Switch, Redirect } from 'react-router-dom';
import { SingleCard } from './layouts';
import { LoginForm, ResetPasswordForm, ChangePasswordForm, CreateAccountForm } from './components';
import { ProtectedRoute } from './components/protected-route/protected-route';

const UnauthenticatedContent: React.FC = () => {
  return (
    <Switch>
      <ProtectedRoute
        exact
        path='/login'
        public={true}
        component={() => (
          <SingleCard title="Sign In">
            <LoginForm />
          </SingleCard>
        )}
      />
      <ProtectedRoute
        exact
        path='/create-account'
        public={true}
        component={() => (
          <SingleCard title="Sign Up">
            <CreateAccountForm />
          </SingleCard>
        )}
      />
      <ProtectedRoute
        exact
        path='/reset-password'
        public={true}
        component={() => (
          <SingleCard
            title="Reset Password"
            description="Please enter the email address that you used to register, and we will send you a link to reset your password via Email."
          >
            <ResetPasswordForm />
          </SingleCard>
        )}
      />
      <ProtectedRoute
        exact
        path='/change-password/:recoveryCode'
        public={true}
        component={() => (
          <SingleCard title="Change Password">
            <ChangePasswordForm />
          </SingleCard>
        )}
      />
      <Redirect to={'/login'} />
    </Switch>
  );
};

export default UnauthenticatedContent;
