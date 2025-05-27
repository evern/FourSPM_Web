# FourSPM Permissions Implementation Plan

## Overview

This document outlines the implementation plan for the permissions system in the FourSPM Web application. The system will use frontend constants mapped to backend permissions to control UI elements and user actions.

## Table of Contents

1. [Permission Constants](#permission-constants)
2. [Permission Context](#permission-context)
3. [Permission Hooks](#permission-hooks)
4. [UI Integration](#ui-integration)
5. [Implementation Timeline](#implementation-timeline)
6. [Testing Strategy](#testing-strategy)

## Permission Constants

### Structure

We will define permission constants in a dedicated file to maintain a single source of truth for all permission strings:

```typescript
// src/constants/permissions.ts
export const PERMISSIONS = {
  // Project-related permissions
  PROJECTS: {
    VIEW: 'projects.view',
    EDIT: 'projects.edit',
    DELETE: 'projects.delete',
    CREATE: 'projects.create'
  },
  
  // Client-related permissions
  CLIENTS: {
    VIEW: 'clients.view',
    EDIT: 'clients.edit',
    DELETE: 'clients.delete',
    CREATE: 'clients.create'
  },
  
  // Deliverable-related permissions
  DELIVERABLES: {
    VIEW: 'deliverables.view',
    EDIT: 'deliverables.edit',
    APPROVE: 'deliverables.approve',
    CREATE: 'deliverables.create',
    DELETE: 'deliverables.delete'
  },
  
  // Area-related permissions
  AREAS: {
    VIEW: 'areas.view',
    EDIT: 'areas.edit',
    CREATE: 'areas.create',
    DELETE: 'areas.delete'
  },
  
  // Discipline-related permissions
  DISCIPLINES: {
    VIEW: 'disciplines.view',
    EDIT: 'disciplines.edit',
    CREATE: 'disciplines.create',
    DELETE: 'disciplines.delete'
  },
  
  // Document-type-related permissions
  DOCUMENT_TYPES: {
    VIEW: 'document-types.view',
    EDIT: 'document-types.edit',
    CREATE: 'document-types.create',
    DELETE: 'document-types.delete'
  },
  
  // Variation-related permissions
  VARIATIONS: {
    VIEW: 'variations.view',
    EDIT: 'variations.edit',
    CREATE: 'variations.create',
    DELETE: 'variations.delete',
    APPROVE: 'variations.approve'
  },
  
  // Role-related permissions
  ROLES: {
    VIEW: 'roles.view',
    EDIT: 'roles.edit',
    CREATE: 'roles.create',
    DELETE: 'roles.delete',
    ASSIGN: 'roles.assign'
  },
  
  // Admin-related permissions
  ADMIN: {
    ACCESS: 'admin.access',
    SETTINGS: 'admin.settings',
    USER_MANAGEMENT: 'admin.user-management'
  },
  
  // System-wide permissions
  SYSTEM: {
    VIEW_REPORTS: 'system.view-reports',
    EXPORT_DATA: 'system.export-data',
    IMPORT_DATA: 'system.import-data'
  }
};
```

### Benefits of Constants Approach

1. **Type Safety**: Constants provide TypeScript type checking
2. **Discoverability**: Developers can easily find available permissions
3. **Consistency**: Ensures consistent permission naming across the application
4. **IDE Support**: Enables autocomplete in development environments
5. **Refactoring**: Makes it easier to rename permissions if needed

## Permission Context

### Context Structure

Following the established Context+Reducer pattern in the application:

```typescript
// src/contexts/user-permissions/user-permissions-types.ts
export interface UserPermission {
  name: string;
  isViewPermission: boolean;
  isEditPermission: boolean;
}

export interface UserPermissionsState {
  permissions: UserPermission[];
  loading: boolean;
  initialized: boolean;
  error: string | null;
}

export interface UserPermissionsContextProps {
  state: UserPermissionsState;
  hasPermission: (permissionName: string) => boolean;
  hasViewPermission: (resource: string) => boolean;
  hasEditPermission: (resource: string) => boolean;
  fetchPermissions: () => Promise<UserPermission[]>;
}

export interface UserPermissionsProviderProps {
  children: React.ReactNode;
}
```

### Implementation Timeline

1. **Phase 1**: Define constants and basic context (Week 1)
2. **Phase 2**: Implement permission hooks and integration with authentication (Week 2)
3. **Phase 3**: Update UI components to respect permissions (Weeks 3-4)
4. **Phase 4**: Testing and refinement (Week 5)

## Permission Hooks

### usePermissionCheck Hook

```typescript
// src/hooks/usePermissionCheck.ts
import { useCallback } from 'react';
import { useUserPermissions } from '../contexts/user-permissions';

export const usePermissionCheck = () => {
  const { state, hasPermission, hasViewPermission, hasEditPermission } = useUserPermissions();
  
  const canView = useCallback((resource: string) => {
    return hasViewPermission(resource);
  }, [hasViewPermission]);
  
  const canEdit = useCallback((resource: string) => {
    return hasEditPermission(resource);
  }, [hasEditPermission]);
  
  const can = useCallback((permissionName: string) => {
    return hasPermission(permissionName);
  }, [hasPermission]);
  
  return {
    can,
    canView,
    canEdit,
    isLoading: state.loading,
    isInitialized: state.initialized
  };
};
```

## UI Integration

### Pattern for UI Components

```tsx
// Example component with permission checks
import { usePermissionCheck } from '../../hooks/usePermissionCheck';
import { PERMISSIONS } from '../../constants/permissions';
import notify from 'devextreme/ui/notify';
import { useEffect } from 'react';

const ProjectsGrid = () => {
  const { canView, canEdit } = usePermissionCheck();
  const isReadOnly = !canEdit('projects');
  
  // Show a toast notification on load for read-only users
  useEffect(() => {
    if (isReadOnly) {
      notify({
        message: 'You have read-only access to projects',
        type: 'info',
        displayTime: 3000,
        position: { at: 'top center', my: 'top center' }
      });
    }
  }, [isReadOnly]);
  
  // Only render if user has view permission
  if (!canView('projects')) {
    return <AccessDeniedMessage resource="projects" />;
  }
  
  return (
    <div className="projects-container">
      <ODataGrid
        /* ... other props ... */
        allowAdding={!isReadOnly}
        allowUpdating={!isReadOnly}
        allowDeleting={!isReadOnly}
        toolbarItems={[
          {
            location: 'after',
            widget: 'dxButton',
            options: {
              icon: 'add',
              text: 'New Project',
              onClick: handleAddProject,
              visible: !isReadOnly // Only show if user can edit
            }
          }
        ]}
      />
    </div>
  );
};
```

### Grid Permission Pattern

```tsx
// Common pattern for grid components with permission checks
const FeatureGrid = () => {
  const { canView, canEdit } = usePermissionCheck();
  const isReadOnly = !canEdit('feature');
  
  // Show toast notification on component mount if user has read-only access
  useEffect(() => {
    if (isReadOnly) {
      notify({
        message: 'You have read-only access to this feature',
        type: 'info',
        displayTime: 3000,
        position: { at: 'top center', my: 'top center' }
      });
    }
  }, [isReadOnly]);
  
  return (
    <ODataGrid
      endpoint={`odata/v1/Feature`}
      columns={columns}
      // Set grid editing permissions based on user permissions
      allowAdding={!isReadOnly}
      allowUpdating={!isReadOnly}
      allowDeleting={!isReadOnly}
      // Other grid props...
    />
  );
};
```

### Button Permission Pattern

```tsx
// Common pattern for buttons with permission checks - using interception pattern
<Button
  text="Edit"
  icon="edit"
  type="default"
  stylingMode="contained"
  onClick={() => {
    // Check permission before executing the action
    if (!canEdit('projects')) {
      // Show permission denied notification
      notify({
        message: 'You do not have permission to edit projects',
        type: 'warning',
        displayTime: 3000,
        position: { at: 'top center', my: 'top center' }
      });
      return;
    }
    
    // If user has permission, proceed with the action
    startEditing();
  }}
  disabled={isLoading} // Only disable during loading, not for permission reasons
/>
```

### Permission-Wrapped Action Pattern

```typescript
// In utils/permission-utils.ts

/**
 * Higher-order function that wraps an action with permission checking
 * @param action The function to execute if permission check passes
 * @param permissionCheck Function that returns true if user has permission
 * @param errorMessage Custom error message to show if permission check fails
 * @returns A new function that checks permissions before executing the action
 */
export const withPermissionCheck = <T extends (...args: any[]) => any>(
  action: T,
  permissionCheck: () => boolean,
  errorMessage: string = 'You do not have permission to perform this action'
): ((...args: Parameters<T>) => ReturnType<T> | void) => {
  return (...args: Parameters<T>): ReturnType<T> | void => {
    // Check if user has permission
    if (!permissionCheck()) {
      // Show permission denied notification
      notify({
        message: errorMessage,
        type: 'warning',
        displayTime: 3000,
        position: { at: 'top center', my: 'top center' },
        width: 'auto',
        closeOnClick: true,
        closeOnOutsideClick: true
      });
      return;
    }
    
    // If user has permission, proceed with the action
    return action(...args);
  };
};

/**
 * Creates a notification for read-only access
 * @param feature The name of the feature with read-only access
 */
export const showReadOnlyNotification = (feature: string): void => {
  notify({
    message: `You have read-only access to ${feature}`,
    type: 'info',
    displayTime: 3000,
    position: { at: 'top center', my: 'top center' },
    width: 'auto',
    closeOnClick: true,
    closeOnOutsideClick: true
  });
};
```

### Implementation Examples

```tsx
// In a component file - direct implementation

// Permission check function - would come from your permission context in real implementation
const canEditProjects = useCallback(() => {
  // This would check actual permissions in a real implementation
  return false; // For demo purposes
}, []);
  
// Wrap the startEditing function with permission check
const handleStartEditing = withPermissionCheck(
  startEditing,
  canEditProjects,
  'You do not have permission to edit projects'
);
  
// Show read-only notification on component mount if needed
useEffect(() => {
  if (!canEditProjects() && !isLoading) {
    showReadOnlyNotification('projects');
  }
}, [canEditProjects, isLoading]);

// Then use handleStartEditing in your button onClick handler
<Button
  text="Edit"
  type="default"
  stylingMode="contained"
  onClick={handleStartEditing}
  icon="edit"
  disabled={isLoading} // Only disable during loading, not for permission reasons
/>
```

```tsx
// In a component file - with full permissions context implementation

import { PERMISSIONS } from '../../constants/permissions';
import { usePermissionCheck } from '../../hooks/usePermissionCheck';

const MyComponent = () => {
  const { can } = usePermissionCheck();
  
  // Wrap any action with permission check
  const handleDelete = withPermissionCheck(
    (id) => deleteProject(id),
    () => can(PERMISSIONS.PROJECTS.DELETE),
    'You do not have permission to delete projects'
  );
  
  return (
    <Button
      text="Delete"
      onClick={() => handleDelete(project.id)}
      disabled={isLoading}
    />
  );
};
```

### Route-Level Protection

```tsx
// Protected route component
const PermissionProtectedRoute = ({
  children,
  requiredPermission,
  redirectPath = '/home'
}) => {
  const { can, isInitialized, isLoading } = usePermissionCheck();
  const navigate = useNavigate();
  
  // Show loading while permissions are being initialized
  if (isLoading || !isInitialized) {
    return <LoadingIndicator />;
  }
  
  // Redirect if user doesn't have required permission
  if (!can(requiredPermission)) {
    useEffect(() => {
      notify({
        message: 'You do not have permission to access this page',
        type: 'error',
        displayTime: 3000
      });
      navigate(redirectPath);
    }, []);
    return null;
  }
  
  return <>{children}</>;
};
```

## Implementation Timeline

| Week | Focus Area | Tasks |
|------|------------|-------|
| 1    | Setup      | Define constants, create context and reducer |
| 2    | Integration| Implement hooks, integrate with authentication |
| 3-4  | UI Updates | Update components to respect permissions |
| 5    | Testing    | Test all permission scenarios, fix issues |

## Testing Strategy

### Unit Tests

- Test permission hooks with various permission combinations
- Verify context state management through reducer tests
- Test UI rendering with mocked permissions

### Integration Tests

- Test permission fetching from the backend
- Verify UI elements visibility with different permission sets
- Test route protection with authentication integration

### Manual Testing

- Create test accounts with different role permissions
- Verify UI elements appear/disappear correctly based on permissions
- Test all protected routes and actions

## Role Definitions

For reference, here are the standard roles and their associated permissions:

| Role | Description | Key Permissions |
|------|-------------|----------------|
| Admin | Full system access | All permissions |
| Project Manager | Manages projects and deliverables | projects.*, deliverables.*, clients.view |
| Engineer | Works on deliverables | projects.view, deliverables.view, deliverables.edit |
| Client | Views project progress | projects.view, deliverables.view |
| Viewer | Read-only access | *.view |
