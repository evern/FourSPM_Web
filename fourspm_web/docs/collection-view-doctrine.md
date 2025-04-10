# Collection View Implementation Doctrine

This document defines the standard architecture and implementation patterns for collection views in the FourSPM Web application. All new collection views MUST follow these patterns to ensure consistency, maintainability, and scalability.

## Standard Architecture

Every collection view in the application MUST be built using the Context + Reducer pattern with specialized hooks for grid behaviors, providing clear separation of concerns and optimized performance:

```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│     Main Component  │    │      Contexts       │    │    Data Sources      │
│                     │    │                     │    │                     │
│  {entity}.tsx       │◄───┤{entity}-context.tsx │◄───┤{entity}DataSource.ts│
│  ├─ {Entity}Content │    │{entity}-editor-     │    │                     │
└─────────────────────┘    │context.tsx          │    └─────────────────────┘
          ▲                 └─────────────────────┘              ▲
          │                           ▲                          │
          │                           │                          │
          │                           │                          │
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   View Definition   │    │   Specialized Hooks │    │   API Endpoints     │
│                     │    │                     │    │                     │
│ {entity}-columns.ts │    │ grid-handlers/*    │    │  api-endpoints.ts   │
│                     │    │ grid-validators/*   │    │                     │
│                     │    │ grid-editors/**     │    │                     │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘

* Entity-specific implementations (mandatory)
** Shared components (optional)
```

Where `{entity}` is replaced with the specific entity name (e.g., deliverable, project, area).

This architecture includes specialized components with defined responsibilities.

### Mandatory Components

1. **Data Context** (`{entity}-context.tsx`): Handles data access, CRUD operations, and application state management
2. **Grid Handlers** (`use{Entity}GridHandlers.ts`): Centralizes grid event handling with proper type safety (entity-specific)
3. **Grid Validators** (`use{Entity}GridValidator.ts`): Contains business validation logic separated from UI concerns (entity-specific)
4. **Columns Definition** (`{entity}-columns.ts`): Defines grid column configuration
5. **API Adapter** (`{entity}.adapter.ts`): Contains API interaction methods

### Optional Components

1. **Editor Context** (`{entity}-editor-context.tsx`): Manages editor field behaviors, validation, and generation of fields like document numbers (only needed for complex editing scenarios)
2. **Grid Editors** (`useSharedGridEditor.ts`): Provides reusable editor preparation and field customization (shared across entities)

## Required Components

### 1. Main Component and Nested Content Component

For complex entity views (like Deliverables), we use a two-layer component approach:

#### 1.1 Main Component (`{entity}.tsx`) 

This component MUST:
- Provide the entity-specific Editor Context if needed
- Export a clean public API

**Required implementation:**
```typescript
// Main entry point that sets up the context providers
export function EntityName(): React.ReactElement {
  return (
    <EntityEditorProvider>
      <EntityContent />
    </EntityEditorProvider>
  );
}

export default EntityName;
```

#### 1.2 Content Component (`{Entity}Content` - nested in same file)

This component MUST:
- Use the data context via a custom hook (e.g., `useDeliverables`) 
- Use the editor context via a custom hook (e.g., `useDeliverableEditor`) when needed
- Implement entity-specific grid event handlers via dedicated hooks (e.g., `use{Entity}GridHandlers`)
- Implement entity-specific grid validators via dedicated hooks (e.g., `use{Entity}GridValidator`)
- Optionally use shared editor functionality (e.g., `useDeliverableGridEditor`) when applicable
- Use data provider hooks for all lookup data
- Render the `ODataGrid` component with standardized handlers
- Include proper error handling and loading states

**Required implementation:**
```typescript
// Internal component that consumes the contexts
const EntityContent = (): React.ReactElement => {
  // Get route parameters (like projectId)
  const { projectId } = useParams<EntityParams>();
  const { user } = useAuth();
  
  // Get everything we need from the entity contexts
  const { state: dataState, validateEntity } = useEntity();
  const { 
    state: editorState, 
    handleEntityEditorPreparing, 
    handleEntityInitNewRow 
  } = useEntityEditor();
  
  // Use data providers with loading tracking
  const { lookupDataSource, isLoading: lookupLoading } = useLookupDataProvider(projectId);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  // Get grid handlers from the custom hook
  const { 
    handleRowValidating,
    handleRowUpdating,
    handleRowInserting,
    handleRowRemoving,
    handleInitNewRow: baseHandleInitNewRow,
    handleEditorPreparing
  } = useEntityGridHandlers({
    validateEntity,
    projectGuid: projectId,
    userToken: user?.token
  });
  
  // Combine grid handler with shared editor functionality (optional pattern)
  // Only needed when using shared editors like useDeliverableGridEditor
  const combinedInitNewRow = useCallback((e: any) => {
    baseHandleInitNewRow(e);
    // Add entity-specific functionality
  }, [baseHandleInitNewRow]);

  // Wait for data to load before initializing the grid
  useEffect(() => {
    if (!lookupLoading) {
      setDataLoaded(true);
    }
  }, [lookupLoading]);

  // Create columns with the lookup data
  const columns = createEntityColumns(lookupDataSource);

  return (
    <div className="entity-container">
      {/* Error handling for both contexts */}
      {(dataState.error || editorState.error) && (
        <div className="alert alert-danger">
          Error: {dataState.error || editorState.error}
        </div>
      )}
      
      {/* Loading indicators */}
      <LoadPanel 
        visible={dataState.loading || !dataLoaded || editorState.isProcessing} 
        message={editorState.loadingMessage || dataState.loadingMessage || 'Loading...'}
        position={{ of: '.entity-grid' }}
      />
      
      <div className="entity-grid">
        <div className="grid-custom-title">Entities</div>
        
        {/* Only render the grid once data is loaded */}
        {dataLoaded && (
          <ODataGrid
            endpoint={ENTITY_ENDPOINT}
            columns={columns}
            onRowValidating={handleRowValidating}
            onRowUpdating={handleRowUpdating}
            onRowInserting={handleRowInserting} 
            onRowRemoving={handleRowRemoving}
            onInitNewRow={handleInitNewRow}
            keyField="guid"
            allowAdding={true}
            allowUpdating={true}
            allowDeleting={true}
            title=" "
            expand={['RelatedEntity']}
            // Add default sort to ensure consistent query parameters
            defaultSort={[{ selector: 'created', desc: true }]}
          />
        )}
      </div>
    </div>
  );

```

### 2. Context (`{entity}-context.tsx`)

The context MUST manage state and validation logic:

- Implement a React Context with a Reducer pattern
- Provide validation functionality for entity fields
- Maintain loading, error, and data states
- Expose a clean and minimal API to components
- Memoize the context value to prevent unnecessary re-renders

**Interface Definition:**

```typescript
// Types for the entity state and context
export interface EntityState {
  loading: boolean;
  error: string | null;
  // Any additional state needed
}

export interface EntityContextType {
  state: EntityState;
  validateEntity: (entity: Entity, rules?: ValidationRule[]) => boolean;
  // Other necessary functionality
}
```

**Context Implementation:**
```typescript
// Context creation
const EntityContext = createContext<EntityContextType | undefined>(undefined);

// Reducer for state management
function entityReducer(state: EntityState, action: EntityAction): EntityState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    // Other action handlers
    default:
      return state;
  }
}

// Context provider
export function EntityProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  // Initialize state with reducer
  const [state, dispatch] = useReducer(entityReducer, {
    loading: false,
    error: null,
  });
  
  // Entity validation function
  const validateEntity = useCallback((entity: Entity, rules: ValidationRule[] = DEFAULT_VALIDATION_RULES): boolean => {
    // Validation logic implementation
    return true; // Return whether validation passed
  }, []);
  
  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    state,
    validateEntity,
  }), [state, validateEntity]);
  
  return (
    <EntityContext.Provider value={contextValue}>
      {children}
    </EntityContext.Provider>
  );
}

// Custom hook to use the context
export function useEntity(): EntityContextType {
  const context = useContext(EntityContext);
  if (context === undefined) {
    throw new Error('useEntity must be used within an EntityProvider');
  }
  return context;
}
```

### 3. Entity-Specific Editor Context

For entities that require complex editor behaviors (like Deliverables), we use a dedicated Editor Context that MUST:

- Be implemented as a separate context from the main data context
- Be provided at the component level, not the application level
- Manage editor-specific behaviors like field validation and document number generation
- Provide editor preparation handlers to manage field editability

**Interface Definition:**

```typescript
// Types for the editor state and context
export interface EntityEditorState {
  isProcessing: boolean;
  error: string | null;
  loadingMessage?: string;
  // Any additional editor-specific state
}

export interface EntityEditorContextType {
  state: EntityEditorState;
  handleEntityEditorPreparing: (e: any) => void;
  handleEntityInitNewRow: (e: any) => void;
  generateDocumentNumber?: (data: Entity) => Promise<string>;
  // Other editor-specific functionality
}
```

**Context Implementation:**
```typescript
// Context creation
const EntityEditorContext = createContext<EntityEditorContextType | undefined>(undefined);

// Reducer for state management
function entityEditorReducer(state: EntityEditorState, action: EntityEditorAction): EntityEditorState {
  switch (action.type) {
    case 'SET_PROCESSING':
      return { ...state, isProcessing: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_LOADING_MESSAGE':
      return { ...state, loadingMessage: action.payload };
    // Other action handlers
    default:
      return state;
  }
}

// Context provider
export function EntityEditorProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  // Initialize state with reducer
  const [state, dispatch] = useReducer(entityEditorReducer, {
    isProcessing: false,
    error: null,
    loadingMessage: undefined
  });
  
  // Track mounted state to prevent updates after unmounting
  const isMountedRef = useRef(true);
  
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Handle editor preparation - control field editability
  const handleEntityEditorPreparing = useCallback((e: any) => {
    const { dataField, editorOptions } = e;
    
    // Handle special field behaviors
    if (dataField === 'documentNumber') {
      // Example: Make document number read-only in certain conditions
      editorOptions.readOnly = true;
    }
  }, []);
  
  // Handle initialization of new rows
  const handleEntityInitNewRow = useCallback((e: any) => {
    // Add default values or generate IDs
    if (e.data) {
      e.data.guid = uuidv4();
    }
  }, []);
  
  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    state,
    handleEntityEditorPreparing,
    handleEntityInitNewRow
  }), [state, handleEntityEditorPreparing, handleEntityInitNewRow]);
  
  return (
    <EntityEditorContext.Provider value={contextValue}>
      {children}
    </EntityEditorContext.Provider>
  );
}

// Custom hook to use the context
export function useEntityEditor(): EntityEditorContextType {
  const context = useContext(EntityEditorContext);
  if (context === undefined) {
    throw new Error('useEntityEditor must be used within an EntityEditorProvider');
  handleRowValidating: (e: any) => void;
  handleRowUpdating: (e: any) => void;
  handleRowInserting: (e: any) => void;
  handleRowRemoving: (e: any) => void;
  handleInitNewRow: (e: any) => void;
  // Specialized operations for this entity type
  specializedOperation: (id: string) => Promise<void>;
}
```

### 2. Grid Validators

Validators MUST:
- Contain all validation business rules
- Return structured validation results
- Use proper type definitions for events and data

```typescript
// Example Validator Interface
export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
  errorField?: string;
}

// Example Event Type
export interface GridRowEvent {
  data: Record<string, any>;
  component: { option: (key: string, value?: any) => any };
  // Other DevExtreme properties with proper types
}
```

### 3. Data Context

Data Context MUST:
- Be implemented as a separate context from the main data context
- Be provided at the component level, not the application level
- Manage data state and CRUD operations
- Expose a clean and minimal API to components

```typescript
// Example Data Context Interface
export interface DataContextHolder {
  state: EntityState;
  // CRUD operations
  createEntity: (entity: Entity) => Promise<Entity>;
  updateEntity: (entity: Entity) => Promise<Entity>;
  deleteEntity: (id: string) => Promise<void>;
  // Other necessary functionality
}
```

### 4. Adapters

Adapters MUST:
- Define the entity interface matching the backend model
- Provide methods for all CRUD operations
- Implement specialized methods for custom operations
- Use centralized API endpoint constants
- Handle OData query parameters and filters consistently

```typescript
// Example Adapter Interface
export interface Adapter<T> {
  // CRUD operations
  getEntities: (token: string) => Promise<T[]>;
  createEntity: (entity: T, token: string) => Promise<T>;
  updateEntity: (entity: T, token: string) => Promise<T>;
  deleteEntity: (id: string, token: string) => Promise<void>;
  // Specialized methods
  specializedOperation: (params: any, token: string) => Promise<any>;
}
```

## Optional Component Implementation Details

### 1. Editor Context

Editor Context MAY be implemented when:
- Complex field generation logic is needed (e.g., document numbers)
- Editor state needs to be shared across components
- Custom validation needs to be applied at the context level

When implemented, it MUST:
- Be provided at the component level, not the application level
- Follow reducer pattern for state management
- Expose field validation and preparation methods

```typescript
// Example Editor Context Interface
export interface EditorContext {
  state: EditorState;
  // Field validation and preparation methods
  validateField: (field: string, value: any) => boolean;
  prepareField: (field: string, value: any) => any;
  // Other necessary functionality
}
```

### 2. Cell Edit Interception Pattern

For advanced grid editing scenarios, especially when dealing with status transitions or needing backend validation, you MAY implement the Cell Edit Interception Pattern:

```typescript
const handleRowUpdating = useCallback((e: any) => {
  // 1. Cancel the grid's default update behavior
  e.cancel = true;
  
  // 2. Extract key and data
  const originalDeliverableGuid = e.key;
  const newData = {...e.oldData, ...e.newData};
  
  // 3. Create async function with proper error handling
  const update = async () => {
    try {
      // 4. Call your API method
      await updateDeliverable(newData, originalDeliverableGuid);
      
      // 5. Refresh grid after update completes
      setTimeout(() => {
        // Exit edit mode first
        if (e.component.hasEditData()) {
          e.component.cancelEditData();
        }
        // Then reload data source
        e.component.getDataSource().reload();
      }, 50);
    } catch (error) {
      console.error('Error updating entity:', error);
      throw error; // Important: re-throw to allow DevExtreme to show error
    }
  };
  
  // 6. Return the update promise (crucial!)
  return update();
}, [dependencies]);
```

This pattern ensures:
- Backend validation is applied before grid updates
- Status transitions are properly handled
- Grid refreshes correctly after backend processing
- Edit mode is exited cleanly after updates
- User sees appropriate error messages if the update fails

### 3. Shared Grid Editors

Shared Grid Editors MAY be implemented when:
- Common editor preparation logic can be reused across entities
- Document number generation or other specialized field handling is needed

When implemented, they MUST:
- Accept configuration via props
- Return base handlers that can be wrapped by entity-specific logic

```typescript
// Example Shared Grid Editor Interface
export interface SharedGridEditor {
  // Base handlers
  handleEditorPreparing: (e: any) => void;
  handleInitNewRow: (e: any) => void;
  // Other necessary functionality
}
```

### 3. Data Providers

Data Providers MAY be implemented when:
- Lookup data is needed for dropdowns or other UI elements
- Reference data must be loaded from external endpoints

When implemented, they MUST:
- Handle caching and error states
- Return both raw data and formatted DataSource objects
- Accept context parameters for filtered data loading
- Implement the loading flag pattern to prevent duplicate requests
- Support conditional loading via the shouldLoad parameter

```typescript
// Example Data Provider Interface
export interface DataProvider {
  // Raw data and DataSource objects
  data: any[];
  dataSource: any;
  // Error state and caching
  error: any;
  isLoading: boolean;
  // Other necessary functionality
}
```

#### 3.1 Staggered Loading Pattern

For components that require multiple data providers, a staggered loading pattern MUST be implemented to:
- Prevent duplicate API requests
- Ensure data providers only load when their dependencies are available
- Improve application performance by reducing unnecessary network traffic

**Implementation Requirements:**

1. **Module-Level Loading Flags and Cache**
   ```typescript
   // At module level outside the hook
   let dataGlobalCache: DataType[] | null = null;
   let isLoadingData = false;
   ```

2. **Conditional Loading Parameter**
   ```typescript
   // Data provider must accept a parameter to control if it should load
   export const useDataProvider = (shouldLoad?: boolean): DataProviderResult => {
     // Rest of implementation
   }
   ```

3. **Loading Check in Data Source Methods**
   ```typescript
   load: function(loadOptions: any) {
     // Skip loading if shouldLoad is false or undefined
     if (shouldLoad === false || shouldLoad === undefined) {
       return Promise.resolve([]);
     }
     
     // Check if already loading
     if (isLoadingData) {
       return new Promise((resolve) => {
         const checkInterval = setInterval(() => {
           if (!isLoadingData && dataGlobalCache) {
             clearInterval(checkInterval);
             resolve(dataGlobalCache);
           }
         }, 100);
       });
     }
     
     // Set loading flag and proceed with fetch...
   }
   ```

4. **Staggered Loading in Context Component**
   ```typescript
   const VariationDeliverablesContent = (): React.ReactElement => {
     // Only load providers when dependencies are available
     const shouldLoadProviders = !!variation && !!project && !!projectGuid;
     
     // Call hooks at top level (Rules of Hooks)
     // But control when they actually fetch data
     const { disciplinesDataSource } = useDisciplineDataProvider(
       shouldLoadProviders ? true : undefined
     );
     
     // Other providers...
   }
   ```

5. **Loading State Management**
   ```typescript
   // Combine loading states for UI indicators
   const isLookupDataLoading = useMemo(
     () => areasLoading || disciplinesLoading || documentTypesLoading,
     [areasLoading, disciplinesLoading, documentTypesLoading]
   );
   ```

This pattern ensures that data providers are loaded efficiently, prevent duplicate requests, and maintain React's Rules of Hooks by calling all hooks at the top level while controlling their behavior with conditional parameters.

## Example Implementations

The following modules serve as reference implementations that adhere to this architecture pattern:

### 1. Deliverables Module
- View Component: `src/pages/deliverables/deliverables.tsx`
- Data Context: `src/contexts/deliverables/deliverables-context.tsx`
- Data Context Types: `src/contexts/deliverables/deliverables-types.ts`
- Data Context Reducer: `src/contexts/deliverables/deliverables-reducer.ts`
- Editor Context: `src/contexts/editor/deliverable-editor-context.tsx`
- Editor Context Types: `src/contexts/editor/deliverable-editor-types.ts`
- Grid Handlers: `src/hooks/grid-handlers/useDeliverableGridHandlers.ts`
- Grid Validator: `src/hooks/grid-handlers/useDeliverableGridValidator.ts`
- Grid Editor: `src/hooks/grid-editors/useDeliverableGridEditor.ts`
- Data Providers: 
  - `src/hooks/data-providers/useAreaDataProvider.ts`
  - `src/hooks/data-providers/useDisciplineDataProvider.ts`
  - `src/hooks/data-providers/useDocumentTypeDataProvider.ts`
- Columns: `src/pages/deliverables/deliverable-columns.ts`
- Adapter: `src/adapters/deliverable.adapter.ts`

### 3. Variation Deliverables Module (Sequential Loading Pattern)
- View Component: `src/pages/variations/variation-deliverables.tsx`
- Data Context: `src/contexts/variation-deliverables/variation-deliverables-context.tsx`
- Context Types: `src/contexts/variation-deliverables/variation-deliverables-types.ts`
- Context Reducer: `src/contexts/variation-deliverables/variation-deliverables-reducer.ts`
- Grid Handlers: `src/hooks/grid-handlers/useVariationDeliverableGridHandlers.ts`
- Grid Validator: `src/hooks/grid-handlers/useVariationDeliverableGridValidator.ts`
- Variation Hooks: `src/hooks/utils/useVariationInfo.ts`, `src/hooks/utils/useProjectInfo.ts`
- Data Providers: 
  - `src/hooks/data-providers/useAreaDataProvider.ts`
  - `src/hooks/data-providers/useDisciplineDataProvider.ts`
  - `src/hooks/data-providers/useDocumentTypeDataProvider.ts`
- Columns: `src/pages/variations/variation-deliverable-columns.ts`
- Adapter: `src/adapters/variation-deliverable.adapter.ts`, `src/adapters/variation.adapter.ts`

### 2. Projects Module
- View Component: `src/pages/projects/projects.tsx`
- Context: `src/contexts/projects/projects-context.tsx`
- Context Types: `src/contexts/projects/projects-types.ts`
- Grid Handlers: `src/hooks/grid-handlers/useProjectGridHandlers.ts` 
- Data Source: `src/stores/clientDataSource.ts`
- Columns: `src/pages/projects/project-columns.ts`


