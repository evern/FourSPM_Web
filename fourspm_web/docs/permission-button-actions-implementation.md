# Permission Button Actions Implementation Plan

## Overview
This document outlines the implementation plan for permission button actions in the FourSPM application. The plan focuses on implementing UI buttons that trigger permission changes, with the backend controller handling the actual permission logic and database operations.

## Objectives
- Implement UI buttons for Access Level permissions (No Access, Read Only, Full Access)
- Implement UI buttons for Toggle permissions (Enable/Disable)
- Keep heavy logic in the backend controller
- Pass simple action types from frontend to backend
- Maintain consistency with existing architecture patterns

## Implementation Steps

### 1. Update permissions-context.tsx

Enhance the permissions context with simple action handlers that pass commands to the backend:

```typescript
// Add these action handlers to the PermissionsContextProps interface
interface PermissionsContextProps {
  // Existing state and functions...
  
  // Action handlers that pass simple commands to the backend
  setPermissionLevel: (featureKey: string, action: string) => Promise<void>; // 'NoAccess', 'ReadOnly', 'FullAccess'
  setToggleState: (featureKey: string, enabled: boolean) => Promise<void>; // true/false
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
}

// In the PermissionsProvider component:
// Use the existing hooks and endpoints

// Get the role permission grid handlers that already contain the core functionality
const { setPermissionLevel, showSuccess, showError } = useRolePermissionGridHandlers();

// Implement the access level handler
const handleAccessLevelChange = useCallback(
  async (featureKey: string, action: string): Promise<void> => {
    try {
      // Convert action string to appropriate permission level for the backend
      // The backend will handle the actual logic of which permissions to add/remove
      await setPermissionLevel(featureKey, action);
      
      // Display success message
      const permissionName = featureKey.split('.')[0]; // Extract feature name for message
      showSuccess(`Permission for ${permissionName} set to ${action}`);
      
      return Promise.resolve();
    } catch (error) {
      showError(`Failed to update permission: ${error.message || 'Unknown error'}`);
      return Promise.reject(error);
    }
  },
  [setPermissionLevel, showSuccess, showError]
);

// Implement the toggle handler
const handleToggleChange = useCallback(
  async (featureKey: string, enabled: boolean): Promise<void> => {
    try {
      // Convert boolean to appropriate action string for the backend
      const action = enabled ? 'Enable' : 'Disable';
      
      // The backend controller will handle the actual toggle logic
      await setPermissionLevel(featureKey, action);
      
      // Display success message
      const featureName = featureKey.split('.')[0]; // Extract feature name for message
      showSuccess(`${featureName} ${enabled ? 'enabled' : 'disabled'}`);
      
      return Promise.resolve();
    } catch (error) {
      showError(`Failed to update permission: ${error.message || 'Unknown error'}`);
      return Promise.reject(error);
    }
  },
  [setPermissionLevel, showSuccess, showError]
);

// Include these in the context value
const contextValue = useMemo(() => ({
  state,
  dispatch,
  // Include our action handlers
  setPermissionLevel: handleAccessLevelChange,
  setToggleState: handleToggleChange,
  showSuccess,
  showError
}), [
  state, 
  dispatch, 
  handleAccessLevelChange,
  handleToggleChange,
  showSuccess, 
  showError
]);
```

### 2. Update permission-columns.ts

Enhance the permission columns to include action buttons that use the simplified handlers:

```typescript
// Import the permissions context
import { usePermissions } from '../../contexts/permissions/permissions-context';
import Button from 'devextreme-react/button';

// In the column configuration function
export const getPermissionColumns = (): ODataGridColumn[] => {
  // Get the action handlers from the permissions context
  const { setPermissionLevel, setToggleState } = usePermissions();
  
  return [
    // Existing columns...
    
    // For AccessLevel type permissions
    {
      dataField: 'actions',
      caption: 'Access Level',
      width: 280,
      cellRender: (cellData) => {
        const { data } = cellData;
        const featureKey = data.featureKey;
        const permissionType = data.permissionType;
        const currentLevel = data.permissionLevel; // Get level from data source
        
        // Only render for AccessLevel type permissions
        if (permissionType !== 'AccessLevel') return null;
        
        return (
          <div className="permission-buttons">
            <Button
              text="No Access"
              type={currentLevel === 'None' ? 'default' : 'outline'}
              onClick={() => setPermissionLevel(featureKey, 'NoAccess')}
            />
            <Button
              text="Read Only"
              type={currentLevel === 'ReadOnly' ? 'default' : 'outline'}
              onClick={() => setPermissionLevel(featureKey, 'ReadOnly')}
            />
            <Button
              text="Full Access"
              type={currentLevel === 'FullAccess' ? 'default' : 'outline'}
              onClick={() => setPermissionLevel(featureKey, 'FullAccess')}
            />
          </div>
        );
      }
    },
    
    // For Toggle type permissions
    {
      dataField: 'actions',
      caption: 'Enable/Disable',
      width: 140,
      cellRender: (cellData) => {
        const { data } = cellData;
        const featureKey = data.featureKey;
        const permissionType = data.permissionType;
        
        // Only render for Toggle type permissions
        if (permissionType !== 'Toggle') return null;
        
        // Get the current state from the data source
        const isEnabled = data.permissionLevel === 'FullAccess';
        
        return (
          <div className="permission-buttons">
            <Button
              text={isEnabled ? 'Enabled' : 'Disabled'}
              type={isEnabled ? 'default' : 'outline'}
              onClick={() => setToggleState(featureKey, !isEnabled)}
            />
          </div>
        );
      }
    }
  ];
};
```

### 3. Ensure permissions-types.ts is up to date

Verify that the necessary types and enums are defined:

```typescript
// If not already defined
export enum PermissionType {
  AccessLevel = 'AccessLevel',
  Toggle = 'Toggle'
}

export enum PermissionLevel {
  NONE = 0,
  FULL_ACCESS = 1,
  READ_ONLY = 2
}
```

### 4. Configure proper error handling and notifications

Ensure proper error handling and success notifications:

```typescript
// In the permissions-context.tsx file

// Make sure to use proper error handling in the async functions
try {
  // API call...
  showSuccess('Permission updated successfully');
} catch (error) {
  showError(`Failed to update permission: ${error.message}`);
  throw error; // Re-throw for the component to handle
}

// Add useful debug logging
console.debug('Permission level changed', { featureKey, level });
```

## Alignment with UI Development Guidelines

### Context+Reducer Pattern
- Uses the recommended Context+Reducer pattern for state management
- Separates state logic from UI components

### Component Organization
- Maintains the layered component design with parent components for context/routing and child components for rendering
- Keeps context providers close to where they're used

### State Management Best Practices
- Uses `useMemo` for context values to prevent unnecessary re-renders
- Uses `useCallback` for all context functions 
- Ensures proper dependency arrays in hooks
- Separates data contexts from UI/editor contexts

## Testing Strategy

### Unit Tests
- Test each action handler in isolation
- Verify that the reducer correctly updates state
- Test error handling in API calls

### Integration Tests
- Test the interaction between context and components
- Verify that permission changes are reflected in the UI

### UI Tests
- Verify buttons appear correctly based on permission types
- Test button click handlers and confirm UI updates

### Edge Cases
- Test with various permission configurations
- Test error states and recovery

## Future Enhancements

- Add batch permission updates for better performance
- Implement permission templates for quick role setup
- Add permission inheritance between related features

## Backend Implementation

### Overview

The backend implementation will handle the simple action strings sent from the frontend and perform the appropriate database operations. This keeps the heavy logic in the controller rather than the frontend.

### Controller Implementation

```csharp
// In RolePermissionsController.cs

[HttpPost]
[Route("SetPermissionLevel")]
public async Task<IActionResult> SetPermissionLevel([FromBody] SetPermissionLevelRequest request)
{
    try
    {
        // Extract data from request
        var roleId = request.RoleId;
        var featureKey = request.FeatureKey;
        var action = request.Action; // 'NoAccess', 'ReadOnly', 'FullAccess', 'Enable', 'Disable'
        
        // Determine the permission type (AccessLevel or Toggle)
        var permissionType = featureKey.EndsWith(".toggle") ? 
            PermissionConstants.TypeToggle : 
            PermissionConstants.TypeAccessLevel;
        
        // For access level permissions
        if (permissionType == PermissionConstants.TypeAccessLevel)
        {
            switch (action)
            {
                case "NoAccess":
                    // Remove both view and edit permissions if they exist
                    await _rolePermissionRepository.RemovePermissionFromRole(roleId, $"{featureKey}.view");
                    await _rolePermissionRepository.RemovePermissionFromRole(roleId, $"{featureKey}.edit");
                    break;
                    
                case "ReadOnly":
                    // Remove edit permission if it exists
                    await _rolePermissionRepository.RemovePermissionFromRole(roleId, $"{featureKey}.edit");
                    
                    // Add view permission if it doesn't exist
                    if (!await _rolePermissionRepository.HasPermission(roleId, $"{featureKey}.view"))
                    {
                        await _rolePermissionRepository.AddPermissionToRole(roleId, $"{featureKey}.view");
                    }
                    break;
                    
                case "FullAccess":
                    // Remove view permission if it exists (since edit implies view)
                    await _rolePermissionRepository.RemovePermissionFromRole(roleId, $"{featureKey}.view");
                    
                    // Add edit permission if it doesn't exist
                    if (!await _rolePermissionRepository.HasPermission(roleId, $"{featureKey}.edit"))
                    {
                        await _rolePermissionRepository.AddPermissionToRole(roleId, $"{featureKey}.edit");
                    }
                    break;
                    
                default:
                    return BadRequest($"Invalid action: {action}");
            }
        }
        // For toggle permissions
        else if (permissionType == PermissionConstants.TypeToggle)
        {
            switch (action)
            {
                case "Enable":
                    // Add the toggle permission if it doesn't exist
                    if (!await _rolePermissionRepository.HasPermission(roleId, featureKey))
                    {
                        await _rolePermissionRepository.AddPermissionToRole(roleId, featureKey);
                    }
                    break;
                    
                case "Disable":
                    // Remove the toggle permission if it exists
                    await _rolePermissionRepository.RemovePermissionFromRole(roleId, featureKey);
                    break;
                    
                default:
                    return BadRequest($"Invalid action: {action}");
            }
        }
        else
        {
            return BadRequest($"Unknown permission type for feature key: {featureKey}");
        }
        
        // Return success result with updated permission summary
        var updatedPermissions = await _rolePermissionRepository.GetRolePermissionSummary(roleId);
        return Ok(updatedPermissions);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error setting permission level");
        return StatusCode(500, "An error occurred while setting permission level");
    }
}
```

### Request Model

```csharp
// Define the request model for setting permission level
public class SetPermissionLevelRequest
{
    public string RoleId { get; set; }
    public string FeatureKey { get; set; }
    public string Action { get; set; } // 'NoAccess', 'ReadOnly', 'FullAccess', 'Enable', 'Disable'
}
```

### Repository Interface

The controller relies on an IRolePermissionRepository interface with these methods:

```csharp
public interface IRolePermissionRepository
{
    // Existing methods...
    
    Task<bool> HasPermission(string roleId, string permission);
    Task AddPermissionToRole(string roleId, string permission);
    Task RemovePermissionFromRole(string roleId, string permission);
    Task<RolePermissionSummary> GetRolePermissionSummary(string roleId);
}
```

## Conclusion

This implementation plan provides a structured approach to adding permission button actions to the FourSPM application. By following the established patterns and guidelines and keeping the heavy logic in the backend controller, we ensure a maintainable and type-safe implementation that integrates seamlessly with the existing architecture.
