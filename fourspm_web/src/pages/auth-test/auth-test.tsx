/**
 * Authentication Test Component
 * 
 * This component is used to test and verify the authentication system, role management,
 * and permission configuration. It provides a UI to test various authentication flows
 * and displays the current authentication state.
 */
import React, { useState, useCallback } from 'react';
import { Button, CheckBox, LoadPanel, TextBox } from 'devextreme-react';
import { useAuth } from '../../auth';
import { CommonPermissions, SystemRoles } from '../../config/permissions';
import './auth-test.scss';

const AuthTestPage: React.FC = () => {
  const {
    user,
    roles,
    permissions,
    loading,
    isAuthenticated,
    error,
    hasPermission,
    hasRole,
    signIn,
    signOut,
    refreshPermissions
  } = useAuth();

  const [showRoles, setShowRoles] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [testPermission, setTestPermission] = useState(CommonPermissions.VIEW_ROLES);
  const [testRole, setTestRole] = useState<string>(SystemRoles.ADMINISTRATOR);

  // Handle sign in
  const handleSignIn = useCallback(async () => {
    try {
      const success = await signIn();
      console.log('Sign in result:', success);
    } catch (error) {
      console.error('Sign in error:', error);
    }
  }, [signIn]);

  // Handle sign out
  const handleSignOut = useCallback(() => {
    signOut();
  }, [signOut]);

  // Handle permission refresh
  const handleRefreshPermissions = useCallback(async () => {
    await refreshPermissions();
  }, [refreshPermissions]);

  // Test if user has a specific permission
  const checkPermission = useCallback(() => {
    const hasSpecificPermission = hasPermission(testPermission);
    alert(`User ${hasSpecificPermission ? 'has' : 'does not have'} permission: ${testPermission}`);
  }, [hasPermission, testPermission]);

  // Test if user has a specific role
  const checkRole = useCallback(() => {
    const hasSpecificRole = hasRole(testRole);
    alert(`User ${hasSpecificRole ? 'has' : 'does not have'} role: ${testRole}`);
  }, [hasRole, testRole]);

  return (
    <div className="auth-test-container">
      <h1>Authentication System Test</h1>
      
      {/* Loading indicator */}
      {loading && <LoadPanel visible={true} message="Processing authentication..." />}
      
      {/* Authentication status */}
      <div className="auth-status">
        <h2>Authentication Status</h2>
        <div className="status-item">
          <span className="label">Authenticated:</span>
          <span className={`value ${isAuthenticated ? 'success' : 'error'}`}>
            {isAuthenticated ? 'Yes' : 'No'}
          </span>
        </div>
        
        {error && (
          <div className="status-item">
            <span className="label">Error:</span>
            <span className="value error">{error}</span>
          </div>
        )}
      </div>
      
      {/* Authentication actions */}
      <div className="auth-actions">
        <h2>Authentication Actions</h2>
        <div className="button-group">
          <Button 
            text="Sign In" 
            type="success" 
            disabled={isAuthenticated} 
            onClick={handleSignIn} 
          />
          <Button 
            text="Sign Out" 
            type="danger" 
            disabled={!isAuthenticated} 
            onClick={handleSignOut} 
          />
          <Button 
            text="Refresh Permissions" 
            type="default" 
            disabled={!isAuthenticated} 
            onClick={handleRefreshPermissions} 
          />
        </div>
      </div>
      
      {/* User information */}
      {isAuthenticated && user && (
        <div className="user-info">
          <h2>User Information</h2>
          <div className="info-item">
            <span className="label">Display Name:</span>
            <span className="value">{user.displayName}</span>
          </div>
          <div className="info-item">
            <span className="label">Email:</span>
            <span className="value">{user.email}</span>
          </div>
          <div className="info-item">
            <span className="label">ID:</span>
            <span className="value">{user.id}</span>
          </div>
        </div>
      )}
      
      {/* Role information */}
      {isAuthenticated && (
        <div className="roles-info">
          <div className="header-with-toggle">
            <h2>Roles ({roles.length})</h2>
            <CheckBox 
              value={showRoles} 
              onValueChanged={e => setShowRoles(e.value as boolean)} 
              text="Show Roles" 
            />
          </div>
          
          {showRoles && (
            <ul className="list">
              {roles.map(role => (
                <li key={role.guid}>
                  <strong>{role.displayName}</strong> ({role.roleName})
                </li>
              ))}
              {roles.length === 0 && <li className="empty">No roles assigned</li>}
            </ul>
          )}
          
          <div className="test-section">
            <TextBox 
              value={testRole} 
              onValueChanged={e => setTestRole(e.value as string)} 
              placeholder="Enter role name to test" 
            />
            <Button 
              text="Test Role" 
              onClick={checkRole} 
              disabled={!isAuthenticated} 
            />
          </div>
        </div>
      )}
      
      {/* Permission information */}
      {isAuthenticated && (
        <div className="permissions-info">
          <div className="header-with-toggle">
            <h2>Permissions ({permissions.length})</h2>
            <CheckBox 
              value={showPermissions} 
              onValueChanged={e => setShowPermissions(e.value as boolean)} 
              text="Show Permissions" 
            />
          </div>
          
          {showPermissions && (
            <ul className="list">
              {permissions.map(permission => (
                <li key={permission}>{permission}</li>
              ))}
              {permissions.length === 0 && <li className="empty">No permissions assigned</li>}
            </ul>
          )}
          
          <div className="test-section">
            <TextBox 
              value={testPermission} 
              onValueChanged={e => setTestPermission(e.value as string)} 
              placeholder="Enter permission to test" 
            />
            <Button 
              text="Test Permission" 
              onClick={checkPermission} 
              disabled={!isAuthenticated} 
            />
          </div>
        </div>
      )}
      
      {/* Token information */}
      {isAuthenticated && user?.token && (
        <div className="token-info">
          <div className="header-with-toggle">
            <h2>Access Token</h2>
            <CheckBox 
              value={showToken} 
              onValueChanged={e => setShowToken(e.value as boolean)} 
              text="Show Token" 
            />
          </div>
          
          {showToken && (
            <div className="token-content">
              <textarea 
                readOnly 
                value={user.token} 
                rows={5} 
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AuthTestPage;
