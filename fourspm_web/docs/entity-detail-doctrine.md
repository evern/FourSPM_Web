# Entity Detail View Implementation Doctrine

This document defines the standard architecture and implementation patterns for entity detail views in the FourSPM Web application. All new entity detail views MUST follow these patterns to ensure consistency, maintainability, and scalability.

## Standard Architecture

Every entity detail view in the application MUST be built using the following interconnected components with clear separation of concerns:

```
┌──────────────────────┐    ┌──────────────────────┐    ┌──────────────────────┐
│      Component       │    │      Controllers     │    │       Adapters       │
│                      │    │                      │    │                      │
│ {entity}-profile.tsx │◄───┤ use{Entity}Entity-   │◄───┤ {entity}.adapter.ts  │
│                      │    │ Controller.ts        │    │                      │
└──────────────────────┘    └──────────────────────┘    └──────────────────────┘
          ▲                           ▲                           ▲
          │                           │                           │
          │                           │                           │
          │                           │                           │
┌──────────────────────┐    ┌──────────────────────┐    ┌──────────────────────┐
│    Form Definition   │    │    Factory Hooks     │    │    Data Providers    │
│                      │    │                      │    │                      │
│ {entity}-profile-    │    │ createEntityHook     │    │ use{LookupEntity}Data│
│ items.ts             │    │ createFormOperation- │    │ Provider.ts          │
│                      │    │ Hook.ts              │    │                      │
└──────────────────────┘    └──────────────────────┘    └──────────────────────┘
                                                                   ▲
                                                                   │
                                                                   │
                                                     ┌──────────────────────┐
                                                     │    API Endpoints     │
                                                     │                      │
                                                     │   api-endpoints.ts   │
                                                     │                      │
                                                     └──────────────────────┘

```

Where `{entity}` is replaced with the specific entity name (e.g., project, client, area).

## Required Components

### 1. View Component (`{entity}-profile.tsx`)

The view component MUST:

- Use `useParams` to extract entity ID from the URL
- Implement the appropriate entity controller hook
- Render a DevExtreme Form component for data display and editing
- Provide clear UI elements for edit/save/cancel operations
- Handle loading and error states appropriately

### 2. Entity Controller (`use{Entity}EntityController.ts`)

The entity controller MUST combine entity data management with form operations and MUST:

- Define a clear interface that extends both `EntityHook<T>` and `FormOperationsHook<T>`
- Leverage `createEntityHook` and `createFormOperationHook` factory functions
- Handle loading, updating, and saving entity data
- Integrate with related data providers for lookup data
- Provide handlers for related entity selection changes

### 3. Form Items Definition (`{entity}-profile-items.ts`)

The form items definition MUST:

- Be isolated in a separate file
- Use a factory function to create form items with appropriate configuration
- Adapt form field properties based on editing mode
- Include proper lookup configurations for dropdown fields
- Handle loading states for lookup data

### 4. Factory Hooks (`createEntityHook.ts`, `createFormOperationHook.ts`)

These reusable factory functions MUST be used to create entity controllers:

1. **`createEntityHook`** - Creates a hook for managing entity data with:
   - Entity data state management (loading, error, data)
   - CRUD operations (load, create, update, delete)
   - Related entity handling
   - Standardized callback pattern

2. **`createFormOperationHook`** - Creates a hook for managing form operations with:
   - Form reference management
   - Edit mode state management (isEditing, isSaving)
   - Form validation and data retrieval
   - Save, cancel, and reset operations
   - Direct field manipulation methods
   - **Standardized lookup field handling** including:
     - Selection change handling via `handleLookupChange`
     - Proper form reset with complex fields
     - Null value handling when selections are cleared
     - Synchronization between form and entity state

#### Standardized Lookup Field Philosophy

The `createFormOperationHook` factory MUST be used with a standardized approach for handling lookup fields. This approach MUST:

- Centralize all lookup field logic in one configuration
- Handle both selection changes and form reset properly
- Maintain synchronization between form and entity state
- Properly clear all related fields when a selection is removed
- Prevent flickering during form operations
- Follow established patterns of standardization and centralization

## Data Flow Standards

1. **Initialization Flow:**
   - Component MUST initialize controller with entity ID
   - Controller MUST auto-load entity data if ID is provided
   - Controller MUST load lookup data providers
   - Form MUST be populated with entity data in read-only mode

2. **Edit Mode Flow:**
   - User MUST trigger edit mode via explicit UI action
   - Form MUST transition to editable state
   - Field validation MUST be applied when editing
   - Original form data MUST be stored for proper reset handling

3. **Save Flow:**
   - Form MUST be validated before saving
   - Controller MUST handle the save operation
   - Success/error notifications MUST be shown
   - Form MUST return to read-only mode on success

4. **Lookup Field Selection Flow:**
   - When lookup selection changes, standardized handling MUST be used
   - Both form and entity data MUST be updated synchronously
   - Related fields MUST be updated based on selection
   - When selections are cleared, all related fields MUST be properly nullified

5. **Form Reset Flow:**
   - When editing is canceled, form reset with original data MUST be used
   - Complex lookup fields MUST be properly reset without flickering
   - Entity state MUST be synchronized with form state during reset

## Implementation Philosophy

### Lookup Field Handling Philosophy

All entity detail views with lookup fields MUST follow these principles:

1. **Centralized Configuration**: Define all lookup fields in one place with their relationships

2. **Synchronized State**: Maintain both form and entity state in sync at all times

3. **Resilient Reset**: Ensure form reset properly restores complex lookup fields

4. **Consistent Null Handling**: Clear all related fields when a selection is removed

5. **Performance Optimization**: Prevent flickering by coordinating state updates

## Implementation Guidelines

### Data Flow Standards

1. **Initialization Flow:**
   - Component MUST initialize controller with entity ID
   - Controller MUST auto-load entity data if ID is provided
   - Controller MUST load lookup data providers
   - Form MUST be populated with entity data in read-only mode

2. **Edit Mode Flow:**
   - User MUST trigger edit mode via explicit UI action
   - Form MUST transition to editable state
   - Field validation MUST be applied when editing
   - Original form data MUST be stored for proper reset handling

3. **Save Flow:**
   - Form MUST be validated before saving
   - Controller MUST handle the save operation
   - Success/error notifications MUST be shown
   - Form MUST return to read-only mode on success

4. **Lookup Field Selection Flow:**
   - When lookup selection changes, standardized handling MUST be used
   - Both form and entity data MUST be updated synchronously
   - Related fields MUST be updated based on selection
   - When selections are cleared, all related fields MUST be properly nullified

5. **Form Reset Flow:**
   - When editing is canceled, form reset with original data MUST be used
   - Complex lookup fields MUST be properly reset without flickering
   - Entity state MUST be synchronized with form state during reset

### Design Principles

1. **Separation of Concerns:**
   - View components MUST only handle rendering
   - Controllers MUST handle all business logic and state
   - Form definitions MUST handle all form configuration
   - Adapters MUST handle all API communication

2. **Hook Composition:**
   - Entity hooks and form hooks MUST be composed together
   - Controller interfaces MUST extend both EntityHook and FormOperationsHook
   - Additional functionality MUST be added through composition

3. **Form State Management:**
   - Read/edit modes MUST be clearly separated
   - Field properties MUST adapt based on current mode
   - Form reset MUST properly restore original values

### Loading and Error Handling

1. **Loading States:**
   - Entity loading MUST show appropriate UI indicator
   - Saving operations MUST show appropriate UI indicator
   - Lookup data loading MUST be handled appropriately

2. **Error Handling:**
   - API errors MUST be caught and displayed
   - Validation errors MUST be displayed in the form
   - Network errors MUST be handled gracefully

### Form Field Handling

1. **Lookup Fields:**
   - Lookup fields MUST use appropriate data providers
   - Selection changes MUST trigger appropriate updates to related fields
   - Loading states MUST be handled for async lookups

2. **Complex Fields:**
   - Nested object fields MUST use dot notation (e.g., 'client.contactName')
   - Custom editors MUST be properly initialized and configured
   - Required fields MUST have appropriate validation

## Implementation Checklist

When implementing a new entity detail view, follow these steps:

1. [ ] Create/update the entity adapter with required CRUD methods
2. [ ] Implement the entity controller hook with EntityHook and FormOperationsHook composition
3. [ ] Define the form items configuration with proper conditional editing
4. [ ] Implement the view component with loading, error, and edit/save/cancel handling
5. [ ] Add the route to app-routes.tsx
6. [ ] Test all operations (loading, editing, saving, canceling)

## Example Implementation

The Project Profile view serves as a reference implementation that adheres to these standards. Refer to the following files for examples:

- View Component: `src/pages/project/project-profile.tsx`
- Controller: `src/hooks/controllers/useProjectEntityController.ts`
- Form Items: `src/pages/project/project-profile-items.ts`
- Factory Hooks:
  - `src/hooks/factories/createEntityHook.ts`
  - `src/hooks/factories/createFormOperationHook.ts`
- Adapter: `src/adapters/project.adapter.ts`
