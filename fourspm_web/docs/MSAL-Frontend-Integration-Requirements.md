# MSAL Frontend Integration Requirements

## Overview

This document outlines the requirements and implementation approach for integrating Microsoft Authentication Library (MSAL) with Single Sign-On (SSO) capabilities into the FourSPM React frontend application. This integration will replace the current token-based authentication system while maintaining compatibility with the updated backend authorization system.

## Current Authentication Implementation

The current authentication system in the FourSPM React application uses:

1. **AuthContext Provider**: A React context that manages authentication state
2. **Local Storage Token Management**: JWT tokens stored in localStorage
3. **Manual Token Validation**: Periodic API calls to validate token validity
4. **Form-Based Authentication**: Username and password form submission

Key components of the current implementation:

- `auth.tsx`: Context provider that manages authentication state and user information
- `auth-api.service.ts`: API service for authentication operations
- `base-api.service.ts`: Base API service for making API requests

## Azure AD Configuration

The application will connect to the following Azure AD resources:

- **Application (client) ID**: c67bf91d-8b6a-494a-8b99-c7a4592e08c1
- **Directory (tenant) ID**: 3c7fa9e9-64e7-443c-905a-d9134ca00da9

## Implementation Requirements

### 1. MSAL Library Integration

#### Required Packages
- `@azure/msal-browser`: Core MSAL functionality for browser applications
- `@azure/msal-react`: React components and hooks for MSAL integration

#### Configuration
- Create environment-specific configuration files:
  - `.env.development`
  - `.env.production`
- Configure MSAL parameters based on environment:
  ```typescript
  export const msalConfig = {
    auth: {
      clientId: process.env.REACT_APP_AZURE_CLIENT_ID!,
      authority: `https://login.microsoftonline.com/${process.env.REACT_APP_AZURE_TENANT_ID}`,
      redirectUri: window.location.origin,
    },
    cache: {
      cacheLocation: 'localStorage',
      storeAuthStateInCookie: false,
    }
  };
  
  export const loginRequest = {
    scopes: ['api://c67bf91d-8b6a-494a-8b99-c7a4592e08c1/Application.User']
  };
  
  export const adminRequest = {
    scopes: ['api://c67bf91d-8b6a-494a-8b99-c7a4592e08c1/Application.Admin']
  };
  ```

### 2. Authentication Context Refactoring

#### AuthProvider Updates
- Replace the current `AuthProvider` with MSAL-based implementation:
  ```typescript
  function AuthProvider({ children }: PropsWithChildren<{}>) {
    const { instance, accounts, inProgress } = useMsal();
    const [user, setUser] = useState<User | undefined>();
    const [loading, setLoading] = useState(true);
    
    // Implementation details...
    
    return (
      <AuthContext.Provider 
        value={{ 
          user, 
          signIn, 
          signOut, 
          loading,
          roles: user?.roles || []
        }}
      >
        {children}
      </AuthContext.Provider>
    );
  }
  ```

#### User Type Updates
- Extend the `User` type to include roles from Azure AD claims:
  ```typescript
  export interface User {
    email: string;
    name?: string;
    roles: string[]; // Array of role names from Azure AD claims
    token: string;   // Access token from MSAL
  }
  ```

#### Authentication Functions
- Implement MSAL-based signIn function:
  ```typescript
  const signIn = useCallback(async () => {
    try {
      // Popup login experience
      const response = await instance.loginPopup(loginRequest);
      
      // Get access token
      const tokenResponse = await instance.acquireTokenSilent({
        ...loginRequest,
        account: accounts[0]
      });
      
      // Extract user information from token claims
      const user: User = {
        email: tokenResponse.account?.username || '',
        name: tokenResponse.account?.name,
        roles: tokenResponse.account?.idTokenClaims?.roles || [],
        token: tokenResponse.accessToken
      };
      
      setUser(user);
      return { isOk: true, data: user };
    } catch (error) {
      return {
        isOk: false,
        message: "Authentication failed"
      };
    }
  }, [instance, accounts]);
  ```

- Implement MSAL-based signOut function:
  ```typescript
  const signOut = useCallback(() => {
    instance.logout();
    setUser(undefined);
  }, [instance]);
  ```

### 3. API Integration

#### HTTP Client Updates
- Update the `base-api.service.ts` to include access tokens from MSAL:
  ```typescript
  export async function apiRequest(url: string, options: RequestInit = {}): Promise<Response> {
    // Get token from MSAL
    const msalInstance = getMsalInstance();
    const accounts = msalInstance.getAllAccounts();
    
    if (accounts.length > 0) {
      try {
        const tokenResponse = await msalInstance.acquireTokenSilent({
          scopes: ['api://c67bf91d-8b6a-494a-8b99-c7a4592e08c1/Application.User'],
          account: accounts[0]
        });
        
        // Add token to request headers
        if (!options.headers) {
          options.headers = {};
        }
        
        Object.assign(options.headers, {
          'Authorization': `Bearer ${tokenResponse.accessToken}`
        });
      } catch (error) {
        console.error('Failed to acquire token silently', error);
        // Handle token acquisition errors
      }
    }
    
    return fetch(url, options);
  }
  ```

#### Token Refresh Handling
- Implement automatic token refresh through MSAL library:
  ```typescript
  // This is handled by MSAL internally when using acquireTokenSilent
  // No manual token refresh is needed as in the current implementation
  ```

### 4. Route Protection

#### Protected Routes Implementation
- Create a `RequireAuth` component to protect routes:
  ```typescript
  function RequireAuth({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, inProgress } = useMsal();
    const location = useLocation();
    
    if (inProgress === InteractionStatus.None && !isAuthenticated) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    
    return <>{children}</>;
  }
  ```

#### Permission-Based Route Protection
- Implement a component that checks for specific permissions:
  ```typescript
  function RequirePermission({ children, permission }: { 
    children: React.ReactNode, 
    permission: string 
  }) {
    const { user } = useAuth();
    const location = useLocation();
    
    // User has SystemAdmin role or the specific permission
    const hasPermission = user?.roles?.includes('SystemAdmin') || 
                         user?.roles?.includes(permission);
    
    if (!hasPermission) {
      return <Navigate to="/unauthorized" state={{ from: location }} replace />;
    }
    
    return <>{children}</>;
  }
  ```

### 5. Login Experience

#### Login UI
- Replace the current login form with MSAL login button:
  ```typescript
  function LoginPage() {
    const { instance } = useMsal();
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    const from = (location.state as any)?.from?.pathname || '/';
    
    const handleLogin = async () => {
      try {
        await instance.loginPopup(loginRequest);
        
        // Redirect to previous page or home
        navigate(from, { replace: true });
      } catch (error) {
        console.error('Login failed', error);
      }
    };
    
    // Redirect if already logged in
    if (user) {
      return <Navigate to={from} replace />;
    }
    
    return (
      <div className="login-container">
        <h2>Login</h2>
        <button onClick={handleLogin}>
          Sign in with Microsoft
        </button>
      </div>
    );
  }
  ```

#### Silent Authentication
- Implement silent sign-in for returning users:
  ```typescript
  // In App.tsx or root component
  function App() {
    const { instance, accounts, inProgress } = useMsal();
    const [silentAuthAttempted, setSilentAuthAttempted] = useState(false);
    
    useEffect(() => {
      const attemptSilentAuth = async () => {
        if (!silentAuthAttempted && accounts.length > 0 && inProgress === InteractionStatus.None) {
          try {
            await instance.acquireTokenSilent({
              scopes: ['api://c67bf91d-8b6a-494a-8b99-c7a4592e08c1/Application.User'],
              account: accounts[0]
            });
          } catch (error) {
            // Silent auth failed, user needs to login again
            console.error('Silent auth failed', error);
          } finally {
            setSilentAuthAttempted(true);
          }
        } else if (accounts.length === 0) {
          setSilentAuthAttempted(true);
        }
      };
      
      attemptSilentAuth();
    }, [instance, accounts, inProgress, silentAuthAttempted]);
    
    // Show loading spinner while silent auth is in progress
    if (inProgress !== InteractionStatus.None || !silentAuthAttempted) {
      return <LoadingSpinner />;
    }
    
    return (
      // Application routing structure
    );
  }
  ```

### 6. Error Handling and Fallbacks

#### Authentication Error Handling
- Implement comprehensive error handling for authentication failures:
  ```typescript
  const signIn = useCallback(async () => {
    try {
      // Login implementation as before
    } catch (error: any) {
      console.error('Authentication failed:', error);
      
      let message = 'Authentication failed';
      if (error instanceof AuthError) {
        // Handle specific MSAL error types
        switch (error.errorCode) {
          case 'user_cancelled':
            message = 'Login canceled by user';
            break;
          case 'interaction_in_progress':
            message = 'Another login operation is in progress';
            break;
          case 'access_denied':
            message = 'Access denied. You may not have permission to access this application.';
            break;
          default:
            message = `Authentication failed: ${error.errorMessage}`;
        }
      }
      
      return {
        isOk: false,
        message
      };
    }
  }, [instance, accounts]);
  ```

#### Network Failure Handling
- Implement retry logic for token acquisition failures:
  ```typescript
  async function getTokenWithRetry(msalInstance: IPublicClientApplication, account: AccountInfo, maxRetries = 3) {
    let attempts = 0;
    
    while (attempts < maxRetries) {
      try {
        return await msalInstance.acquireTokenSilent({
          scopes: ['api://c67bf91d-8b6a-494a-8b99-c7a4592e08c1/Application.User'],
          account
        });
      } catch (error) {
        attempts++;
        if (attempts >= maxRetries || !(error instanceof AuthError)) {
          throw error;
        }
        
        // Add exponential backoff delay
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts - 1)));
      }
    }
    
    throw new Error('Failed to acquire token after maximum retries');
  }
  ```

### 7. Development and Testing Support

#### Dev Environment Configuration
- Add development configuration to support local testing:
  ```typescript
  // .env.development
  REACT_APP_ENVIRONMENT=development
  REACT_APP_AZURE_CLIENT_ID=c67bf91d-8b6a-494a-8b99-c7a4592e08c1
  REACT_APP_AZURE_TENANT_ID=3c7fa9e9-64e7-443c-905a-d9134ca00da9
  ```

### 8. Role Management UI

#### Role Management Component
- Create a React component for role management, following the pattern of the variations component:
  ```tsx
  function Roles(): React.ReactElement {
    return (
      <RolesProvider>
        <RolesContent />
      </RolesProvider>
    );
  }
  ```
  
- Implement grid for viewing and managing roles:
  ```tsx
  const RolesContent = (): React.ReactElement => {
    const { user } = useAuth();
    const { state } = useRoles();
    const { 
      handleRowValidating,
      handleRowInserting,
      handleRowUpdating,
      handleRowRemoving,
      handleInitNewRow
    } = useRolesGridHandlers({
      userToken: user?.token
    });
  
    // Toast notification handlers
    const showSuccess = (message: string) => notify({
      message: `Success: ${message}`,
      type: 'success',
      displayTime: 2000,
      position: { at: 'top center', my: 'top center', offset: '0 10' }
    });
  
    const showError = (message: string) => notify({
      message: `Error: ${message}`,
      type: 'error',
      displayTime: 3500,
      position: { at: 'top center', my: 'top center', offset: '0 10' }
    });
  
    return (
      <div className="roles-container">      
        <LoadPanel 
          visible={state.loading} 
          message={'Loading roles...'}
          position={{ of: '.custom-grid-wrapper' }}
        />
      
        <div className="custom-grid-wrapper">
          <div className="grid-custom-title">Role Management</div>
          
          <ODataGrid
            title=" "
            endpoint="api/v1/roles"
            columns={roleColumns({ showSuccess, showError })}
            keyField="roleName"
            onRowValidating={handleRowValidating}
            onRowInserting={handleRowInserting}
            onRowUpdating={handleRowUpdating}
            onRowRemoving={handleRowRemoving}
            onInitNewRow={handleInitNewRow}
            allowAdding={true}
            allowUpdating={true}
            allowDeleting={true}
            defaultSort={[{ selector: 'created', desc: true }]}
            customGridHeight={700}
            countColumn="guid"
          />
        </div>
      </div>
    );
  };
  ```

#### Role Management Columns
- Implement a column configuration file that includes a button for navigating to permissions:
  ```tsx
  export const roleColumns = (config: RoleColumnsConfig) => [
    {
      dataField: 'roleName',
      caption: 'Role Name',
      dataType: 'string',
      validationRules: [{ type: 'required' }],
      allowEditing: false  // Cannot edit role name after creation
    },
    {
      dataField: 'displayName',
      caption: 'Display Name',
      dataType: 'string',
      validationRules: [{ type: 'required' }]
    },
    {
      dataField: 'description',
      caption: 'Description',
      dataType: 'string'
    },
    {
      dataField: 'isSystemRole',
      caption: 'System Role',
      dataType: 'boolean',
      width: 120,
      alignment: 'center'
    },
    {
      dataField: 'guid',
      caption: 'Permissions',
      width: 120,
      alignment: 'center',
      allowFiltering: false,
      allowSorting: false,
      cellTemplate: 'permissionsTemplate',
      editCellTemplate: 'permissionsEditTemplate',
      formItem: {
        visible: false  // Hide in popup edit form
      }
    }
  ] as ODataGridColumn[];
  ```

#### Permission Management Component
- Create a component for managing permissions for a specific role:
  ```tsx
  function RolePermissions(): React.ReactElement {
    return (
      <RolePermissionsProvider>
        <RolePermissionsContent />
      </RolePermissionsProvider>
    );
  }
  ```
  
- Implement a grid or form-based UI for managing role permissions:
  ```tsx
  const RolePermissionsContent = (): React.ReactElement => {
    const { roleName } = useParams<{ roleName: string }>();
    const { user } = useAuth();
    const { state, role, availablePermissions, selectedPermissions, updatePermissions } = useRolePermissions();
    
    // Group permissions by category for display
    const permissionsByCategory = React.useMemo(() => {
      const grouped: Record<string, PermissionInfo[]> = {};
      
      if (availablePermissions) {
        availablePermissions.forEach(permission => {
          if (!grouped[permission.category]) {
            grouped[permission.category] = [];
          }
          grouped[permission.category].push(permission);
        });
      }
      
      return grouped;
    }, [availablePermissions]);
    
    // Handle permission changes
    const handlePermissionChange = (permissionName: string, isChecked: boolean) => {
      const newPermissions = [...selectedPermissions];
      
      if (isChecked) {
        newPermissions.push(permissionName);
      } else {
        const index = newPermissions.indexOf(permissionName);
        if (index !== -1) {
          newPermissions.splice(index, 1);
        }
      }
      
      updatePermissions(newPermissions);
    };
    
    // Handle saving permissions
    const handleSave = async () => {
      try {
        await saveRolePermissions(roleName, selectedPermissions, user?.token);
        notify({
          message: 'Permissions updated successfully',
          type: 'success',
          displayTime: 2000,
          position: { at: 'top center', my: 'top center' }
        });
      } catch (error) {
        notify({
          message: `Error updating permissions: ${error.message}`,
          type: 'error',
          displayTime: 3500,
          position: { at: 'top center', my: 'top center' }
        });
      }
    };
    
    return (
      <div className="role-permissions-container">
        <LoadPanel visible={state.loading} />
        
        <div className="permissions-header">
          <h2>Permissions for {role?.displayName || roleName}</h2>
          <Button text="Save" type="success" onClick={handleSave} />
        </div>
        
        <div className="permissions-content">
          {Object.entries(permissionsByCategory).map(([category, permissions]) => (
            <div key={category} className="permission-category">
              <h3>{category}</h3>
              <div className="permission-items">
                {permissions.map(permission => (
                  <div key={permission.name} className="permission-item">
                    <CheckBox 
                      value={selectedPermissions.includes(permission.name)}
                      onValueChanged={e => handlePermissionChange(permission.name, e.value)}
                      text={permission.displayName}
                      disabled={permission.isEditPermission && selectedPermissions.includes(permission.name.replace('.Edit', '.View'))}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  ```

#### Role Management Context
- Implement a context for managing role state:
  ```tsx
  interface RolesState {
    loading: boolean;
    error: string | null;
    roles: Role[];
  }
  
  interface RolesContextType {
    state: RolesState;
    addRole: (role: Role) => Promise<void>;
    updateRole: (role: Role) => Promise<void>;
    deleteRole: (roleName: string) => Promise<void>;
  }
  
  const RolesContext = createContext<RolesContextType>({} as RolesContextType);
  
  export function RolesProvider({ children }: PropsWithChildren<{}>) {
    const [state, setState] = useState<RolesState>({
      loading: true,
      error: null,
      roles: []
    });
    
    // Implementation of context functions...
    
    return (
      <RolesContext.Provider value={{ state, addRole, updateRole, deleteRole }}>
        {children}
      </RolesContext.Provider>
    );
  }
  ```

#### Permission Management Context
- Implement a context for managing permissions state:
  ```tsx
  interface PermissionInfo {
    name: string;
    displayName: string;
    category: string;
    isEditPermission: boolean;
  }
  
  interface RolePermissionsState {
    loading: boolean;
    error: string | null;
  }
  
  interface RolePermissionsContextType {
    state: RolePermissionsState;
    role: Role | null;
    availablePermissions: PermissionInfo[];
    selectedPermissions: string[];
    updatePermissions: (permissions: string[]) => void;
  }
  
  export function RolePermissionsProvider({ children }: PropsWithChildren<{}>) {
    // State implementation
    // Fetching available permissions and current role permissions
    // Implementation of context functions...
    
    return (
      <RolePermissionsContext.Provider 
        value={{ 
          state, 
          role, 
          availablePermissions, 
          selectedPermissions, 
          updatePermissions 
        }}
      >
        {children}
      </RolePermissionsContext.Provider>
    );
  }
  ```

#### Role Management API Services
- Create API service for role management:
  ```tsx
  export async function getRoles(token: string): Promise<ApiResponse<Role[]>> {
    try {
      const response = await apiRequest('api/v1/roles', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      return { isOk: true, data };
    } catch (error) {
      return { isOk: false, message: error.message };
    }
  }
  
  export async function saveRole(role: Role, token: string): Promise<ApiResponse<Role>> {
    try {
      const url = role.guid ? `api/v1/roles/${role.guid}` : 'api/v1/roles';
      const method = role.guid ? 'PUT' : 'POST';
      
      const response = await apiRequest(url, {
        method,
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(role)
      });
      
      const data = await response.json();
      return { isOk: true, data };
    } catch (error) {
      return { isOk: false, message: error.message };
    }
  }
  ```

- Create API service for permission management:
  ```tsx
  export async function getAvailablePermissions(token: string): Promise<ApiResponse<PermissionInfo[]>> {
    try {
      const response = await apiRequest('api/v1/permissions/available', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      return { isOk: true, data };
    } catch (error) {
      return { isOk: false, message: error.message };
    }
  }
  
  export async function getRolePermissions(roleName: string, token: string): Promise<ApiResponse<string[]>> {
    try {
      const response = await apiRequest(`api/v1/roles/${roleName}/permissions`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      return { isOk: true, data };
    } catch (error) {
      return { isOk: false, message: error.message };
    }
  }
  
  export async function saveRolePermissions(roleName: string, permissions: string[], token: string): Promise<ApiResponse<void>> {
    try {
      await apiRequest(`api/v1/roles/${roleName}/permissions`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ permissions })
      });
      
      return { isOk: true };
    } catch (error) {
      return { isOk: false, message: error.message };
    }
  }
  ```

## Migration Plan

### Phase 1: MSAL Integration Setup
- Install required MSAL packages
- Create MSAL configuration files
- Set up environment-specific configuration

### Phase 2: Authentication Context Updates
- Refactor `AuthProvider` to use MSAL
- Update `User` type to include roles
- Implement MSAL-based signIn and signOut functions

### Phase 3: API Integration
- Update API service to use MSAL tokens
- Implement automatic token refresh
- Update error handling

### Phase 4: Route Protection

#### Protected Routes Implementation
- Implement MSAL-based route protection for all routes except the home page
- Keep the home page accessible without authentication
- Add permission-based route guards for other pages

### Phase 5: Login Experience
- Replace current login form with MSAL login button
- Implement silent authentication
- Add comprehensive error handling

