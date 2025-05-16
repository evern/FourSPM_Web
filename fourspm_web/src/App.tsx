import 'devextreme/dist/css/dx.common.css';
import './themes/generated/theme.base.css';
import './themes/generated/theme.additional.css';
import React from 'react';
import { HashRouter as Router } from 'react-router-dom';
import './dx-styles.scss';
import './app-loading.scss';
import LoadPanel from 'devextreme-react/load-panel';
import { NavigationProvider } from './contexts/navigation';
import { AuthProvider, useAuth, msalInstance } from './auth/AuthContext';
import { useScreenSizeClass } from './utils/media-query';
import Content from './Content';
import UnauthenticatedContent from './UnauthenticatedContent';
import { useThemeContext, ThemeContext } from './theme/theme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

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
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <NavigationProvider>
              <AppContent />
            </NavigationProvider>
          </AuthProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </ThemeContext.Provider>
    </Router>
  );
}

const Root: React.FC = () => {
  const themeContext = useThemeContext();
  const [msalInitialized, setMsalInitialized] = React.useState(false);

  // Ensure MSAL is initialized before rendering the app
  React.useEffect(() => {
    const initializeMsal = async () => {
      try {
        await msalInstance.initialize();
        console.log('MSAL successfully initialized');
        setMsalInitialized(true);
      } catch (error) {
        console.error('Failed to initialize MSAL:', error);
      }
    };

    initializeMsal();
  }, []);

  // Only render when both theme and MSAL are ready
  return themeContext.isLoaded && msalInitialized ? <RootApp /> : <div className="app-loading">Loading...</div>;
}

export default Root;
