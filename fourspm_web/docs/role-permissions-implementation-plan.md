# Role Permissions Implementation Plan

This document outlines the implementation plan for adding a Permission Management feature to the Roles module in the FourSPM Web application. This feature will allow administrators to control which application features a role can access by toggling permissions between no access, read-only access, or full access.

## Overview

The Role Permissions feature will enable administrators to assign specific permission levels to roles by toggling between read-only and full access checkboxes for different application features. It will be accessible from the Roles grid via a "View Permissions" button, similar to how Variation Deliverables are accessed from the Variations grid. The backend will provide a static list of permissions through a PermissionsController (not yet implemented), and the UI will allow selecting between read-only and full access for each feature.

## Implementation Steps

### Phase 1: Core Structure and State Management

1. **Create Files in Directory Structure** (Priority: High)
   - Create permission-related files in the existing directory structure
   - The component files will go in `/src/pages/permissions`
   - The context files will go in `/src/contexts/permissions`
   - Grid handlers will use the existing `/src/hooks/grid-handlers` directory

2. **Create Types Definitions** (Priority: High, Dependency: Step 1)
   - Create `/src/contexts/permissions/permissions-types.ts` with:
     - `StaticPermission` interface with properties like `featureKey`, `displayName`, `description`, `featureGroup`
     - `PermissionLevel` enum with values `NONE`, `READ_ONLY`, `FULL_ACCESS`
     - `RolePermission` interface that matches `RolePermissionEntity` with properties like `guid`, `roleGuid`, `permission`
     - `FeaturePermission` interface that groups a feature's read and edit permissions
     - `PermissionAssignment` interface that tracks a feature's permission level (none, read-only, full)
     - `PermissionsState` interface for context state management
     - `PermissionsAction` type for reducer actions
     - `PermissionsContextType` interface for context functions

3. **Implement State Management** (Priority: High, Dependency: Step 2)
   - Create `/src/contexts/permissions/permissions-reducer.ts` with:
     - Initial state definition
     - Reducer function to handle state actions
     - Actions for setting static permissions, role permissions, changing permission levels, and handling loading/error states

4. **Create API Configuration** (Priority: High, Dependency: None)
   - Add `STATIC_PERMISSIONS_ENDPOINT` constant to `/src/config/api-endpoints.ts` for retrieving static permissions
   - Add `ROLE_PERMISSIONS_ENDPOINT` constant for retrieving and modifying role permissions

### Phase 2: Context Implementation

5. **Create Context Provider** (Priority: High, Dependency: Steps 1-3)
   - Create `/src/contexts/permissions/permissions-context.tsx` with:
     - Context creation
     - Provider component with reducer
     - `usePermissions` hook for consuming the context
     - Token handling for API authentication
     - Functions for fetching static permissions
     - Functions for fetching role permissions
     - Function for setting permission level (none, read-only, full)
     - Logic to handle permission level changes, including removing conflicting permissions

6. **Create Permission Adapter** (Priority: Medium, Dependency: Step 4)
   - Create `/src/adapters/permission.adapter.ts` with:
     - Function to fetch all static permissions from the backend
     - Function to fetch permissions assigned to a specific role
     - Function to add a permission to a role
     - Function to remove a permission from a role
     - Function to replace one permission with another (e.g., replace view with edit)

### Phase 3: Grid and Component Implementation

7. **Create Column Definitions** (Priority: Medium, Dependency: Step 2)
   - Create `/src/pages/permissions/permission-columns.ts` with:
     - Column definitions for permissions grid
     - Column for feature name and description
     - Column with two custom checkbox editors (read-only and full access)
     - Grouping by feature group
     - Logic to ensure only one checkbox can be selected at a time

8. **Implement Grid Handlers** (Priority: Medium, Dependency: Steps 5, 6)
   - Create `/src/hooks/grid-handlers/usePermissionGridHandlers.ts` with:
     - Checkbox change handlers for read-only and full access toggles
     - Logic to handle mutual exclusivity between checkboxes
     - Editor preparation handler for checkbox configuration
     - Event handlers to prevent standard grid CRUD operations

9. **Update Role Columns for Navigation** (Priority: Medium, Dependency: None)
   - Update `/src/pages/roles/role-columns.ts` to enable the "View Permissions" button:
     - Modify the `onClick` handler to navigate to the permissions page for the selected role
     - Route format: `#/roles/{roleId}/permissions`

10. **Create Permission Components** (Priority: Medium, Dependency: Steps 7, 8)
    - Create `/src/pages/permissions/role-permissions.tsx` with:
      - Main RolePermissions component with PermissionsProvider
      - RolePermissionsContent component for rendering
      - Grid for displaying permissions with dual-checkbox columns (read-only and full access)
      - Notification handling for permission changes
      - Error handling
      - Role information display
      - Logic to disable standard grid editing capabilities
      - Logic to handle mutual exclusivity between read-only and full access checkboxes

11. **Create Styling** (Priority: Low, Dependency: Step 10)
    - Create `/src/pages/permissions/role-permissions.scss` with:
      - Consistent styling with other modules
      - Grid customizations
      - Permission level dropdown styling

### Phase 4: Navigation and Integration

12. **Create Route** (Priority: Medium, Dependency: Step 10)
    - Add route to `/src/app-routes.tsx` for the RolePermissions component
    - Path: `/roles/:roleId/permissions`

## Technical Notes

### Permission Model

The permission model will consist of:

1. **Static Permissions** from the backend, organized by feature:
   - Each feature will have two permission types:
     - Read permission (e.g., "deliverables.view")
     - Edit permission (e.g., "deliverables.edit")
   - Each permission will include:
     - Feature key (e.g., "deliverables")
     - Display name (e.g., "Deliverables")
     - Description (e.g., "Ability to create and modify deliverables")
     - Feature group (for grouping in the UI)

2. **Role Permission Entity** with:
   - Guid (primary key)
   - RoleGuid (foreign key to Role)
   - Permission (string - the name of the static permission, e.g., "deliverables.view" or "deliverables.edit")
   - Standard audit fields

### Expected Backend API Endpoints

The following endpoints will be needed from the backend:

- `GET /odata/v1/StaticPermissions` - Get all available static permissions
- `GET /odata/v1/RolePermissions?$filter=roleGuid eq {roleId}` - Get permissions assigned to a specific role
- `POST /odata/v1/RolePermissions` - Add a permission to a role
- `DELETE /odata/v1/RolePermissions({guid})` - Remove a permission from a role

### Permission Assignment

The application will use two checkboxes for each feature, with the following behavior:

1. **Read-Only Checkbox**:
   - When checked: Add the "feature.view" permission (e.g., "deliverables.view")
   - When unchecked: Remove the "feature.view" permission
   - When checked while Full Access is already checked: Uncheck Full Access, remove "feature.edit" permission, add "feature.view" permission

2. **Full Access Checkbox**:
   - When checked: Add the "feature.edit" permission (e.g., "deliverables.edit")
   - When unchecked: Remove the "feature.edit" permission
   - When checked while Read-Only is already checked: Uncheck Read-Only, remove "feature.view" permission, add "feature.edit" permission

This ensures that a feature has either no permission, read-only permission, or full access permission, but never both simultaneously.

### UI Components

1. **Permission Grid**: A grid displaying all available features with:
   - Feature grouping
   - Feature name and description columns
   - Two checkbox columns:
     - Read-Only: Toggles the "feature.view" permission
     - Full Access: Toggles the "feature.edit" permission
   - Logic to ensure only one checkbox can be selected at a time

2. **Role Header**: Display of the current role name and description

3. **Immediate Updates**: Permission changes take effect immediately (no save button required)

### Pattern Adherence

This implementation follows these established patterns:

1. Context+Reducer pattern for state management
2. Two-layer component approach (Provider and Content)
3. Grid component for data display and management
4. Direct use of DevExtreme components
5. Consistent error handling and notification display
6. Feature-based organization of code

### Implementation Notes

- The permissions page will be pre-populated with static permissions from the backend, grouped by feature
- The grid will show all features with two checkbox columns (Read-Only and Full Access)
- When Read-Only is toggled ON:
  - If Full Access is already ON: Turn Full Access OFF and remove the "feature.edit" permission
  - Add the "feature.view" permission
- When Full Access is toggled ON:
  - If Read-Only is already ON: Turn Read-Only OFF and remove the "feature.view" permission
  - Add the "feature.edit" permission
- When either checkbox is toggled OFF:
  - Remove the corresponding permission
- Standard grid editing operations (add, edit, delete) will be disabled
- No route protection is required in this initial implementation

## Future Considerations

1. **More Granular Permissions**: Support for more specific actions like "export", "print", etc.
2. **Permission Inheritance**: Allow permissions to inherit from parent features
3. **Dynamic Permissions**: Support for runtime-defined permissions
4. **Permission Presets**: Predefined permission sets for common role types
5. **UI Controls Based on Permissions**: Dynamically show/hide UI elements based on user permissions
6. **Permission Groups**: Ability to select/deselect groups of related permissions
7. **Permission Search**: Search functionality for finding specific permissions in large lists
