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

**Required implementation pattern:**
```typescript
const {Entity}Profile: React.FC = () => {
  // Get entityId from URL parameters
  const { entityId = '' } = useParams<{Entity}ProfileParams>();
  const { user } = useAuth();
  
  // Use entity controller with integrated form operations
  const { 
    // Entity state and operations
    entity,
    
    // Form operations
    setFormRef,
    isEditing,
    isSaving,
    startEditing,
    cancelEditing,
    saveForm,
    
    // Lookup data and operations
    lookupData,
    isLookupDataLoading,
    handleLookupDataChange
  } = use{Entity}EntityController(entityId, {
    onUpdateSuccess: () => {
      // Handle successful update
    }
  });
  
  // Custom save handler to handle special cases
  const handleSave = useCallback(async () => {
    try {
      // Use the controller's saveForm method
      const result = await saveForm(entityId, 
        (id, data) => update{Entity}(id, data, user?.token || ''));
        
      // Handle successful save
    } catch (error) {
      // Handle error
    }
  }, [entityId, saveForm, user?.token]);
  
  // Generate form items based on entity data and mode
  const formItems = create{Entity}FormItems(
    entity.data || {} as {Entity},
    Boolean(isEditing),
    handleLookupDataChange,
    isLookupDataLoading,
    lookupData
  );

  return (
    <div className="profile-container">
      {/* Loading indicator */}
      <LoadPanel visible={entity.isLoading || isSaving} />
      
      {/* Header with title and action buttons */}
      <div className="grid-header-container">
        <div className="grid-custom-title">{/* Entity title */}</div>
        <div className="action-buttons">
          {!isEditing ? (
            <Button text="Edit" onClick={startEditing} />
          ) : (
            <>
              <Button text="Save" onClick={handleSave} />
              <Button text="Cancel" onClick={cancelEditing} />
            </>
          )}
        </div>
      </div>
      
      {/* Form component */}
      <Form
        formData={entity.data || {}}
        items={formItems}
        readOnly={!isEditing}
        onInitialized={(e) => setFormRef(e.component)}
      />
    </div>
  );
};
```

### 2. Entity Controller (`use{Entity}EntityController.ts`)

The entity controller MUST combine entity data management with form operations and MUST:

- Define a clear interface that extends both `EntityHook<T>` and `FormOperationsHook<T>`
- Leverage `createEntityHook` and `createFormOperationHook` factory functions
- Handle loading, updating, and saving entity data
- Integrate with related data providers for lookup data
- Provide handlers for related entity selection changes

**Interface Definition:**
The controller interface definition is CRITICAL as it clearly documents all functionality provided by the controller:

```typescript
/**
 * Interface for {Entity} entity controller hook (for single entity operations)
 */
export interface {Entity}EntityControllerHook extends EntityHook<{Entity}>, FormOperationsHook<{Entity}> {
  // Lookup data and loading state
  lookupData: LookupEntity[];
  isLookupDataLoading: boolean;
  
  // Handlers for lookup data changes
  handleLookupDataChange: (e: any) => void;
  updateEntityLookupFields: (lookupId: string) => Promise<boolean>;
  
  // Any specialized entity operations
  specializedOperation: (params: any) => Promise<void>;
}
```

**Example from Project controller:**
```typescript
/**
 * Interface for Project entity controller hook (for single entity operations)
 */
export interface ProjectEntityControllerHook extends EntityHook<Project>, FormOperationsHook<Project> {
  // Client data and selection
  clients: Client[];
  isClientLoading: boolean;
  
  // Client operations
  handleClientSelectionChange: (e: any) => void;
  updateProjectClient: (clientId: string) => Promise<Project | null>;
  updateClientFields: (clientId: string) => Promise<boolean>;
}
```

**Controller implementation pattern:**
```typescript
export const use{Entity}EntityController = (
  entityId?: string,
  config?: {Entity}OperationsConfig
): {Entity}EntityControllerHook => {
  // Get authenticated user token
  const { user } = useAuth();
  const userToken = user?.token;

  // Create entity hook for data operations
  const entityHook = createEntityHook<{Entity}>({
    services: {
      getById: (id, token) => fetch{Entity}(id, token),
      update: (id, data, token) => update{Entity}(id, data, token),
      create: (data, token) => create{Entity}(data, token),
      delete: (id, token) => delete{Entity}(id, token)
    },
    callbacks: {
      onLoadSuccess: (result) => {
        // Load related entities if needed
      },
      onError: (error, operation) => {
        // Handle errors
      },
      onUpdateSuccess: (result) => {
        notify('Entity updated successfully', 'success', 3000);
        
        if (config?.onUpdateSuccess) {
          config.onUpdateSuccess(result);
        }
      }
    },
    // Auto-load the entity when component mounts if ID is available
    autoLoadId: entityId
  }, userToken);
  
  // Create form operations hook
  const formHook = createFormOperationHook<{Entity}>({
    onSaveSuccess: (result) => {
      // Success handled by entity callbacks
    },
    onSaveError: (error) => {
      // Error handled by entity callbacks
    }
  });
  
  // Use data providers for lookup data
  const { lookupData, isLoading: isLookupDataLoading } = useLookupDataProvider();
  
  // Handler for lookup selection changes
  const handleLookupDataChange = useCallback((e: any) => {
    // Implementation
  }, [/* dependencies */]);
  
  // Return combined hooks and additional functionality
  return {
    ...entityHook,
    ...formHook,
    lookupData,
    isLookupDataLoading,
    handleLookupDataChange,
    // Additional methods
  };
};
```

### 3. Form Items Definition (`{entity}-profile-items.ts`)

The form items definition MUST:

- Be isolated in a separate file
- Use a factory function to create form items with appropriate configuration
- Adapt form field properties based on editing mode
- Include proper lookup configurations for dropdown fields
- Handle loading states for lookup data

**Form items pattern:**
```typescript
/**
 * Creates the form items configuration for the {Entity} Profile form
 * @param entityData Current entity data
 * @param isEditing Whether the form is in edit mode
 * @param onLookupChange Event handler for lookup selection changes
 * @param isLoadingLookup Whether lookup data is currently loading
 * @param lookupData Array of available lookup entities
 * @returns Form items configuration
 */
export const create{Entity}FormItems = (
  entityData: {Entity},
  isEditing: boolean,
  onLookupChange: (e: any) => void,
  isLoadingLookup: boolean = false,
  lookupData: LookupEntity[] = []
): IGroupItemProps[] => [
  {
    itemType: 'group',
    caption: 'Entity Information',
    colCountByScreen: { xs: 1, sm: 1, md: 2, lg: 2 },
    items: [
      // Form fields with conditional editing
      { 
        itemType: 'simple',
        dataField: 'field1',
        editorOptions: { readOnly: !isEditing }
      },
      {
        itemType: 'simple',
        dataField: 'lookupField',
        editorType: 'dxSelectBox',
        editorOptions: {
          dataSource: lookupData,
          valueExpr: 'id',
          displayExpr: item => item ? `${item.code} - ${item.name}` : '',
          readOnly: !isEditing,
          searchEnabled: isEditing,
          showClearButton: isEditing,
          onValueChanged: onLookupChange
        }
      },
      // Additional fields
    ]
  },
  // Additional groups
];
```

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

### 5. Data Providers (`use{LookupEntity}DataProvider.ts`)

Data provider hooks MUST follow the same pattern as in collection views, providing:

- Data arrays for entity references
- Loading and error states
- Helper methods for finding items by ID or code

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

3. **Save Flow:**
   - Form MUST be validated before saving
   - Controller MUST handle the save operation
   - Success/error notifications MUST be shown
   - Form MUST return to read-only mode on success

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
