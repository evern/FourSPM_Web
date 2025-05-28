import 'devextreme/dist/css/dx.common.css';
import './themes/generated/theme.base.css';
import './themes/generated/theme.additional.css';
import React from 'react';
import { HashRouter as Router } from 'react-router-dom';
import './dx-styles.scss';
import LoadPanel from 'devextreme-react/load-panel';
import { NavigationProvider } from './contexts/navigation';

import { MSALAuthProvider, useMSALAuth } from './contexts/msal-auth';
import { useScreenSizeClass } from './utils/media-query';
import Content from './Content';
import UnauthenticatedContent from './UnauthenticatedContent';
import { useThemeContext, ThemeContext } from './theme/theme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';


const AppContent: React.FC = () => {
  const { user, loading } = useMSALAuth(); // Use MSAL authentication
  const screenSizeClass = useScreenSizeClass();
  const themeContext = useThemeContext();
  
  // Check if we need to redirect to login page after Microsoft logout
  React.useEffect(() => {
    const redirectToLogin = sessionStorage.getItem('fourspm_redirect_to_login');
    if (redirectToLogin === 'true' && !user) {
      // Clear the flag so we don't redirect again on page refresh
      sessionStorage.removeItem('fourspm_redirect_to_login');

      window.location.href = window.location.origin + '/#/login';
    }
  }, [user]);

  if (loading) {
    return (
      <LoadPanel 
        visible={true} 
        message="Initializing application..." 
        showIndicator={true} 
        shading={true}
      />
    );
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


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, 
      gcTime: 30 * 60 * 1000, 
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
        <QueryClientProvider client={queryClient}>

          <MSALAuthProvider>
              <NavigationProvider>
                <AppContent />
              </NavigationProvider>
          </MSALAuthProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </ThemeContext.Provider>
    </Router>
  );
}

const Root: React.FC = () => {
  const themeContext = useThemeContext();
  return themeContext.isLoaded ? <RootApp /> : null;
}

export default Root;
