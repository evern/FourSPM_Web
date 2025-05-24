# Roles Module Implementation Plan

This document outlines the implementation plan for adding a Roles management module to the FourSPM Web application. The module will follow the established patterns used in other features like Variations, adhering to the Context+Reducer pattern and established UI guidelines.

## Overview

The Roles module will enable administrators to perform CRUD operations on role records using the ODataGrid component, similar to the Variations module. The key difference is that Roles don't require a project ID parameter unlike Variations. It will be accessible from the Configurations menu in the navigation sidebar. The backend API endpoints are already implemented in the RolesController.cs.

## Implementation Steps

### Phase 1: Core Structure and State Management

1. **Create Files in Existing Directory Structure** (Priority: High)
   - Create role files in the existing directory structure, no new folders needed
   - The component files will go in `/src/pages/roles`
   - The context files will go in `/src/contexts/roles`
   - Grid handlers will use the existing `/src/hooks/grid-handlers` directory

2. **Create Types Definitions** (Priority: High, Dependency: Step 1)
   - Create `/src/contexts/roles/roles-types.ts` with:
     - Role interface matching RoleEntity properties
     - RolesState interface for context state management
     - RolesAction type for reducer actions
     - RolesContextType interface for context functions

3. **Implement State Management** (Priority: High, Dependency: Step 2)
   - Create `/src/contexts/roles/roles-reducer.ts` with:
     - Initial state definition
     - Reducer function to handle state actions

4. **Create API Configuration** (Priority: High, Dependency: None)
   - Add `ROLES_ENDPOINT` constant to `/src/config/api-endpoints.ts`

### Phase 2: Context Implementation

5. **Create Context Provider** (Priority: High, Dependency: Steps 1-3)
   - Create `/src/contexts/roles/roles-context.tsx` with:
     - Context creation
     - Provider component with reducer
     - `useRoles` hook for consuming the context
     - Token handling for API authentication
     - Validation functions
     - Default values for new roles

6. **Create Role Adapter** (Priority: Medium, Dependency: Step 4)
   - Create `/src/adapters/role.adapter.ts` with:
     - Functions for any specialized API operations
     - Interface with the OData endpoints

### Phase 3: Grid and Component Implementation

7. **Create Column Definitions** (Priority: Medium, Dependency: Step 2)
   - Create `/src/pages/roles/role-columns.ts` with:
     - Column definitions for the ODataGrid
     - Include button renderer for "View Permissions" (similar to Variations)

8. **Implement Grid Handlers** (Priority: Medium, Dependency: Steps 5, 6)
   - Create `/src/hooks/grid-handlers/useRoleGridHandlers.ts` with:
     - Row validation handler
     - Row insertion handler
     - Row update handler
     - Editor preparation handler
     - New row initialization handler

9. **Create Role Components** (Priority: Medium, Dependency: Steps 7, 8)
   - Create `/src/pages/roles/roles.tsx` with:
     - Main Roles component with RolesProvider
     - RolesContent component for rendering
     - ODataGrid configuration
     - Notification handling
     - Error handling

10. **Create Styling** (Priority: Low, Dependency: Step 9)
    - Create `/src/pages/roles/roles.scss` with:
      - Consistent styling with other modules
      - Grid customizations
      - Responsive design considerations

### Phase 4: Navigation and Integration

11. **Add Navigation Entry** (Priority: Medium, Dependency: Step 9)
    - Update `/src/app-navigation.ts` to include the Roles module under Configurations
    - Use an appropriate icon for the roles menu item

12. **Create Route** (Priority: Medium, Dependency: Step 11)
    - Add route to `/src/app-routes.tsx` for the Roles component

### Phase 5: Future Permissions Module (Placeholder)

13. **Plan Permissions Structure** (Priority: Low, Dependency: Complete Roles Module)
    - Design the data structure for role permissions
    - Create interfaces for permissions management
    - Plan API endpoints for permissions (not implemented yet)

14. **Create Permissions Navigation** (Priority: Low, Dependency: Step 13)
    - Implement the "View Permissions" button functionality to navigate to a permissions page
    - Create a placeholder permissions page that will be implemented in the future

## Technical Notes

### RoleEntity Properties

The Roles module will manage entities with these properties:
- Guid: Unique identifier
- Name: System name for the role
- DisplayName: User-friendly name
- Description: Optional description
- IsSystemRole: Flag indicating system-defined role
- Audit fields: Created, CreatedBy, Updated, UpdatedBy, Deleted, DeletedBy

### API Endpoints

The following endpoints are available in RolesController.cs:
- GET /odata/v1/Roles - Get all roles
- GET /odata/v1/Roles({key}) - Get a specific role
- POST /odata/v1/Roles - Create a role
- PUT /odata/v1/Roles({key}) - Update a role
- DELETE /odata/v1/Roles({key}) - Delete a role
- PATCH /odata/v1/Roles({key}) - Partially update a role

### Pattern Adherence

This implementation follows these established patterns:
1. Context+Reducer pattern for state management
2. Two-layer component approach (Provider and Content)
3. ODataGrid for data display and management with built-in CRUD operations
4. Direct use of DevExtreme components
5. Centralized validation logic
6. Consistent error handling and notification display

### Implementation Notes

- **CRUD Operations**: All create, read, update, and delete operations will be handled directly by the ODataGrid component, which connects to the backend API endpoints
- **Reference Implementation**: The Variations module (see `/src/pages/variations/variations.tsx` and `/src/contexts/variations/variations-context.tsx`) serves as the reference implementation
- **Key Difference**: Unlike Variations, the Roles module doesn't require a project ID parameter, making the implementation simpler
- **Existing Structure**: Use the existing folder structure in the application - no additional folders need to be created

## Next Steps

After completing the Roles module, the next phase would be to implement the Permissions module that allows assigning specific permissions to roles. This would require additional backend API endpoints and frontend components.
