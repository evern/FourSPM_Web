import 'devextreme/dist/css/dx.common.css';
import './themes/generated/theme.base.css';
import './themes/generated/theme.additional.css';
import React from 'react';
import { HashRouter as Router } from 'react-router-dom';
import './dx-styles.scss';
import LoadPanel from 'devextreme-react/load-panel';
import { NavigationProvider } from './contexts/navigation';
import { useScreenSizeClass } from './utils/media-query';
import Content from './Content';
import UnauthenticatedContent from './UnauthenticatedContent';
import { useThemeContext, ThemeContext } from './theme/theme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider, useAuth } from './auth/auth-context';
import { MsalProvider } from '@azure/msal-react';
import { PublicClientApplication, EventType } from '@azure/msal-browser';
import { msalConfig } from './auth/msalConfig';
import { SilentAuthHandler } from './auth/silent-auth-handler';

// Initialize MSAL instance
const msalInstance = new PublicClientApplication(msalConfig);

// Configure event listeners for MSAL events
msalInstance.addEventCallback((event) => {
  // When a token expires, dispatch an event to trigger the refresh
  if (event.eventType === EventType.ACQUIRE_TOKEN_SUCCESS) {
    console.log('Token acquired successfully');
  } else if (event.eventType === EventType.ACQUIRE_TOKEN_FAILURE) {
    console.error('Token acquisition failed:', event.error);
  } else if (event.eventType === EventType.LOGIN_SUCCESS) {
    console.log('Login successful');
  } else if (event.eventType === EventType.LOGOUT_SUCCESS) {
    console.log('Logout successful');
    // Clear any saved paths on logout
    sessionStorage.removeItem('lastPath');
  }
});

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const screenSizeClass = useScreenSizeClass();
  const themeContext = useThemeContext();

  if (loading) {
    return <LoadPanel visible={true} />;
  }

  if (user) {
    return (
      <div className={`app dx-theme-material-${themeContext.theme} app-theme-${themeContext.theme} ${screenSizeClass}`} style={{ backgroundColor: 'var(--dx-surface-color)' }}>
        <Content />
      </div>
    );
  }

  return <UnauthenticatedContent />;
}

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const RootApp = () => {
  const themeContext = useThemeContext();

  return (
    <Router>
      <ThemeContext.Provider value={themeContext}>
        <MsalProvider instance={msalInstance}>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <SilentAuthHandler>
                <NavigationProvider>
                  <AppContent />
                </NavigationProvider>
              </SilentAuthHandler>
            </AuthProvider>
            <ReactQueryDevtools initialIsOpen={false} />
          </QueryClientProvider>
        </MsalProvider>
      </ThemeContext.Provider>
    </Router>
  );
}

const Root: React.FC = () => {
  const themeContext = useThemeContext();
  return themeContext.isLoaded ? <RootApp /> : null;
}

export default Root;
