# Collection View Implementation Doctrine

This document defines the standard architecture and implementation patterns for collection views in the FourSPM Web application. All new collection views MUST follow these patterns to ensure consistency, maintainability, and scalability.

## Standard Architecture

### Determining Implementation Approach

When implementing a new collection view, first determine whether it's a simple or complex view:

**Simple Collection Views:**
- Reference data with minimal business logic (e.g., Disciplines, Areas, Document Types)
- No complex state transitions or workflows
- Limited field validation requirements
- Primarily CRUD operations with standard behaviors

**Complex Collection Views:**
- Business entities with complex workflows (e.g., Deliverables, Variations)
- Multiple related data dependencies
- Complex state transitions or field calculations
- Specialized UI requirements beyond standard grid operations

**Instructions for AI Code Assistants:**

When implementing a collection view where complexity is not clearly specified:
1. **Ask the user**: "Is this a simple reference data collection view (like Disciplines, Areas) or a complex business entity view (like Deliverables, Variations) with advanced workflows?"
2. If still unclear, recommend the complex implementation to ensure future extensibility
3. Document the chosen approach in the implementation

Every collection view in the application MUST be built using the enhanced Context + React Query pattern with specialized hooks for grid behaviors, providing clear separation of concerns and optimized performance:

```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│     Main Component  │    │      Context        │    │    Data Hooks       │
│                     │    │                     │    │                     │
│  {entity}.tsx       │◄───┤{entity}-context.tsx │◄───┤useProjectData.ts    │
│  ├─ {Entity}Content │    │   State Management │     │useDataProvider.ts   │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
          │                           ▲                          ▲
          │                           │                          │
          ▼                           │                          │
          │                           │                          │
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   Component Logic   │    │   OData Grid        │    │   API Layer         │
│                     │    │                     │    │                     │
│ grid-handlers/*     │───►│ ODataGrid.tsx       │◄───┤  api-endpoints.ts   │
│ {entity}-columns.ts │    │ Direct API Connect  │    │                     │
│                     │    │                     │    │                     │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘

* Entity-specific implementations (mandatory)
** Shared components (optional)
```

Where `{entity}` is replaced with the specific entity name (e.g., deliverable, project, area).

This architecture includes specialized components with defined responsibilities and incorporates React Query for optimized data fetching and state management.

### Hybrid Architecture for Performance

The architecture uses a hybrid approach to balance state management needs with performance concerns:

1. **Context for Shared State** - Context provides centralized state management for shared data
2. **React Query for Reference Data** - React Query efficiently fetches and caches reference/lookup data
3. **Direct ODataGrid for Large Datasets** - ODataGrid connects directly to API endpoints for handling large datasets without intermediate hooks or contexts
4. **Component-Level Grid Handlers** - Grid event handlers reside in the component that uses them

This hybrid approach provides several benefits:

1. **Better Performance** - Direct ODataGrid connections avoid React re-renders for large datasets
2. **Simplified State Management** - Context handles only necessary shared state
3. **Optimized Caching** - React Query efficiently caches reference data
4. **Clear Responsibility Boundaries** - Components handle their own behaviors

#### Direct API Endpoint Connection Pattern

A foundational aspect of this architecture is that the ODataGrid component connects **directly** to API endpoints without intermediate data fetching mechanisms:

1. **Direct Endpoint Connection** - The ODataGrid component takes an `endpoint` prop that points directly to the API endpoint URL
2. **No Intermediate Fetching** - The component handles its own data fetching; we do NOT fetch the data separately via React Query or other hooks
3. **Context Role** - For entity views using ODataGrid, the context should NOT fetch the main entity data directly, as this would create duplicate requests
4. **Context Responsibilities** - The context should focus on cache invalidation, loading states, and reference data management

```tsx
// CORRECT: ODataGrid connects directly to endpoint
<ODataGrid
  endpoint={DISCIPLINES_ENDPOINT}
  // other props...
/>

// INCORRECT: Don't fetch the same data in the context
// const { data } = useQuery({
//   queryKey: ['disciplines'],
//   queryFn: fetchDisciplines // This creates duplicate requests!
// });
```

This pattern ensures optimal performance for large datasets and prevents unnecessary duplicate network requests.

#### Direct Grid Operation Hook Pattern

For simpler reference data views (like Areas, Disciplines, Document Types), use the `createGridOperationHook` factory function directly rather than implementing custom handlers:

1. **Use Factory Function** - Use the `createGridOperationHook` factory function to generate standardized grid operation handlers
2. **Centralize Configuration** - Define validation rules, error handlers, and success callbacks in a single configuration object
3. **Connect with Context** - Have the grid handlers access the context for error reporting and cache invalidation

```tsx
// CORRECT: Use the factory pattern for simpler reference data views
const gridOperations = createGridOperationHook({
  endpoint: AREAS_ENDPOINT,
  validationRules: AREA_VALIDATION_RULES,
  onUpdateError: (error) => setError(error.message),
  invalidateCache: invalidateAllLookups,
  defaultValues: {
    guid: uuidv4(),
    projectGuid: projectId
  }
}, userToken);

// INCORRECT: Don't implement custom handlers when the factory can be used
// const handleRowUpdating = useCallback((e: any) => {
//   // Custom implementation duplicating factory functionality
// }, []);
```

This ensures consistent implementation across reference data components and reduces code duplication.

#### Specialized Validators for Complex Views

For complex collection views (like Deliverables, Variations, Progress updates), implement dedicated validator hooks to handle business-specific validation logic:

1. **Create Specialized Validators** - Implement custom validator hooks (e.g., `useDeliverableProgressGridValidator`) for complex business rules
2. **Use Data Providers** - Connect validators to data providers for dependent entity validation
3. **Implement Business Logic** - Include complex validation like relationship checks, state transitions, and constraint validation

```tsx
// EXAMPLE: Complex validator for business entities
export function useDeliverableProgressGridValidator() {
  // Get dependent data from providers
  const { gates: deliverableGates } = useDeliverableGateDataProvider();

  // Implement specialized validation logic
  const validateGatePercentage = useCallback((e: any): boolean => {
    // Complex business rules validation
    if (e.newData.cumulativeEarntPercentage !== undefined) {
      const currentGate = deliverableGates.find(
        gate => compareGuids(gate.guid, e.newData.deliverableGateGuid)
      );
      
      // Business constraint validation
      if (currentGate && e.newData.cumulativeEarntPercentage > currentGate.maxPercentage) {
        e.isValid = false;
        e.errorText = `Percentage cannot exceed gate maximum of ${currentGate.maxPercentage}%`;
        return false;
      }
    }
    return true;
  }, [deliverableGates]);
  
  // Return validator functions
  return { validateGatePercentage, validateOtherBusinessRules };
}
```

When working with complex collection views, these specialized validators ensure business rules are enforced consistently.

#### Sequential Loading Pattern

A critical aspect of collection views is the proper sequencing of data loading, especially for lookup data. This pattern MUST be followed for all collection views and can be implemented with React Query through dependent queries:

1. **Parent Entity Loading** - First load the parent entity (typically project)
2. **Primary Entity Loading** - Load the primary entities using the parent's ID (e.g., deliverables, areas)
3. **Lookup Data Loading** - Load lookup data once parent entities are available, using the `enabled` flag in React Query:
   ```tsx
   // Example of sequential loading with React Query
   const { projectId } = useParams();
   
   // 1. First load the parent entity (project)
   const { data: project } = useQuery({
     queryKey: ['project', projectId],
     queryFn: () => fetchProject(projectId),
     enabled: !!projectId
   });
   
   // 2. Then load the primary entities (e.g., deliverables)
   const { data: deliverables } = useQuery({
     queryKey: ['deliverables', projectId],
     queryFn: () => fetchDeliverables(projectId),
     enabled: !!project // Only runs when project is available
   });
   
   // 3. Load lookup data for grid editing
   const { data: lookupData } = useQuery({
     queryKey: ['lookup', projectId],
     queryFn: () => fetchLookupData(projectId),
     enabled: !!project, // Only runs when project is fully loaded
   });
   ```

4. **Loading State Management** - Track loading states for each sequential step to communicate progress to users

This pattern ensures proper data dependencies are respected while still leveraging React Query's caching capabilities.

This approach provides the benefits of React Query (caching, background refetching, optimistic updates) while maintaining the architectural pattern of the application.

### Mandatory Components

1. **Data Context** (`{entity}-context.tsx`): Handles shared state and reference data via React Query
2. **Component with Grid Handlers**: Main component uses grid handler hooks directly
3. **Grid Validators** (`use{Entity}GridValidator.ts`): Contains business validation logic separated from UI concerns (entity-specific)
4. **Columns Definition** (`{entity}-columns.ts`): Defines grid column configuration
5. **API Adapter** (`{entity}.adapter.ts`): Contains API interaction methods

### Optional Components

1. **Editor Context** (`{entity}-editor-context.tsx`): Manages editor field behaviors, validation, and generation of fields like document numbers (only needed for complex editing scenarios)
2. **Grid Editors** (`useSharedGridEditor.ts`): Provides reusable editor preparation and field customization (shared across entities)

## Required Components

### 1. Main Component and Nested Content Component

For complex entity views (like Deliverables), we use a two-layer component approach:

#### 1. Main Component (`{entity}.tsx`)

This is the entry point for a collection view. It is responsible for setting up all necessary context providers and handling routing concerns.

#### Responsibilities:

1. **Route Parameter Handling**: Extract and validate URL parameters
2. **Context Setup**: Provide the valid parameters to context providers
3. **Component Composition**: Set up the component hierarchy

**Required implementation:**
```typescript
// Main entry point that sets up the context providers
export function EntityName(): React.ReactElement {
  // Handle routing concerns in the component, not the context
  const { entityId } = useParams<EntityParams>();
  
  // Validate parameters before passing to context
  if (!entityId) {
    return <div className="error-message">Entity ID is missing from the URL.</div>;
  }
  
  return (
    <EntityProvider entityId={entityId}>
      <EntityContent />
    </EntityProvider>
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
- Columns: `src/pages/variations/variation-deliverable-columns.ts`
- Adapter: `src/adapters/variation-deliverable.adapter.ts`, `src/adapters/variation.adapter.ts`

### 2. Projects Module
- View Component: `src/pages/projects/projects.tsx`
- Context: `src/contexts/projects/projects-context.tsx`
- Context Types: `src/contexts/projects/projects-types.ts`
- Grid Handlers: `src/hooks/grid-handlers/useProjectGridHandlers.ts` 
- Data Source: `src/stores/clientDataSource.ts`
- Columns: `src/pages/projects/project-columns.ts`

## CRUD Operations Implementation Pattern

The Variations context (`src/contexts/variations/variations-context.tsx`) provides an exemplary implementation of the CRUD operations pattern within our architecture. This pattern should be followed for all complex business entities requiring state management.

### Core CRUD Pattern

All entity contexts should implement the following CRUD operations pattern:

1. **Create (Add) Operation**
```typescript
const addEntity = useCallback(async (entity: EntityType): Promise<EntityType> => {
  if (!user?.token || !isMountedRef.current) {
    throw new Error('Unable to create entity - user is not authenticated');
  }
  
  try {
    dispatch({ type: 'ADD_ENTITY_START', payload: entity });
    const newEntity = await createEntity(entity, user.token);
    
    if (isMountedRef.current) {
      dispatch({ type: 'ADD_ENTITY_SUCCESS', payload: newEntity });
    }
    return newEntity;
  } catch (error) {
    if (isMountedRef.current) {
      dispatch({ 
        type: 'ADD_ENTITY_ERROR', 
        payload: { 
          error: error instanceof Error ? error.message : 'Failed to create entity',
          entity
        } 
      });
    }
    throw error;
  }
}, [user?.token]);
```

2. **Read Operation**
```typescript
const fetchEntities = useCallback(async (parentId: string) => {
  if (!user?.token || !isMountedRef.current) return;
  
  try {
    dispatch({ type: 'FETCH_ENTITIES_START' });
    const entities = await getParentEntities(parentId, user.token);
    
    if (isMountedRef.current) {
      dispatch({ type: 'FETCH_ENTITIES_SUCCESS', payload: entities });
    }
  } catch (error) {
    if (isMountedRef.current) {
      dispatch({ type: 'FETCH_ENTITIES_ERROR', payload: error instanceof Error ? error.message : 'Failed to fetch entities' });
    }
  }
}, [user?.token]);
```

3. **Update Operation**
```typescript
const updateEntity = useCallback(async (entity: EntityType): Promise<EntityType> => {
  if (!user?.token || !isMountedRef.current) {
    throw new Error('Unable to update entity - user is not authenticated');
  }
  
  try {
    dispatch({ type: 'UPDATE_ENTITY_START', payload: entity });
    await updateEntityApi(entity, user.token);
    
    if (isMountedRef.current) {
      dispatch({ type: 'UPDATE_ENTITY_SUCCESS', payload: entity });
    }
    return entity;
  } catch (error) {
    if (isMountedRef.current) {
      dispatch({ 
        type: 'UPDATE_ENTITY_ERROR', 
        payload: { 
          error: error instanceof Error ? error.message : 'Failed to update entity',
          entity
        } 
      });
    }
    throw error;
  }
}, [user?.token]);
```

4. **Delete Operation**
```typescript
const deleteEntity = useCallback(async (id: string): Promise<void> => {
  if (!user?.token || !isMountedRef.current) {
    throw new Error('Unable to delete entity - user is not authenticated');
  }
  
  try {
    dispatch({ type: 'DELETE_ENTITY_START', payload: id });
    await deleteEntityApi(id, user.token);
    
    if (isMountedRef.current) {
      dispatch({ type: 'DELETE_ENTITY_SUCCESS', payload: id });
    }
  } catch (error) {
    if (isMountedRef.current) {
      dispatch({ 
        type: 'DELETE_ENTITY_ERROR', 
        payload: { 
          error: error instanceof Error ? error.message : 'Failed to delete entity',
          id
        } 
      });
    }
    throw error;
  }
}, [user?.token]);
```

### Critical Implementation Details

1. **Mount State Tracking**

Always use an `isMountedRef` to prevent state updates after component unmounting:

```typescript
// CRITICAL: Track the component mount state to prevent state updates after unmounting
const isMountedRef = React.useRef(true);

useEffect(() => {
  // Set mounted flag to true when component mounts
  isMountedRef.current = true;
  
  // Clean up function to prevent state updates after unmounting
  return () => {
    isMountedRef.current = false;
  };
}, []);
```

2. **Context Value Memoization**

Always memoize the context value to prevent unnecessary re-renders:

```typescript
// CRITICAL: Memoize the context value to prevent unnecessary re-renders
const contextValue = useMemo(() => ({
  state,
  validateEntity,
  fetchEntities,
  addEntity,
  updateEntity,
  deleteEntity,
  // Additional functions
  specializedFunction,
  // Cache invalidation
  invalidateAllLookups
}), [
  state, 
  validateEntity,
  fetchEntities,
  addEntity,
  updateEntity,
  deleteEntity,
  // Additional dependencies
  specializedFunction,
  // Cache invalidation dependency
  invalidateAllLookups
]);
```

3. **React Query Cache Invalidation**

Implement a cache invalidation function to refresh dependent data after entity operations:

```typescript
// Cache invalidation function - invalidates all related lookup data
const invalidateAllLookups = useCallback(() => {
  // Invalidate any queries that might use entities as reference data
  queryClient.invalidateQueries({ queryKey: ['entities'] });
  queryClient.invalidateQueries({ queryKey: ['lookup'] });
  queryClient.invalidateQueries({ queryKey: ['parent'] });
  
  console.log('Invalidated all lookup data after entity change');
}, [queryClient]);
```

4. **Grid Handler Integration**

Connect grid handlers to use the context CRUD functions while maintaining proper state:  

```typescript
// In grid handlers file
export function useEntityGridHandlers() {
  // Get the entity context for CRUD operations
  const { 
    addEntity, 
    updateEntity, 
    deleteEntity: removeEntity, 
    invalidateAllLookups 
  } = useEntityContext();
  
  // Handle row updating - cancel default behavior and use our context function
  const handleRowUpdating = useCallback((e: any) => {
    // Cancel default grid behavior
    e.cancel = true;
    
    const update = async () => {
      try {
        // Map grid data to entity model
        const updatedEntity = {
          ...e.oldData,
          ...e.newData
        };
        
        // Call the context method directly with skipStateUpdate=true to prevent UI flickering
        // This prevents unnecessary context state updates while still updating the database
        await updateEntity(updatedEntity, true);
        
        // Invalidate caches after successful update
        invalidateAllLookups();
        
        // Refresh the grid
        setTimeout(() => {
          if (e.component.hasEditData()) {
            e.component.cancelEditData();
          }
          e.component.getDataSource().reload();
        }, 50);
      } catch (error) {
        // Re-throw to propagate to DevExtreme
        throw error;
      }
    };
    
    // Return the update promise
    return update();
  }, [updateEntity, invalidateAllLookups]);
  
  return {
    handleRowUpdating,
    // Other handler functions...
  };
}
```

This standardized CRUD operations pattern ensures that all entity contexts provide consistent behavior, proper error handling, and optimized performance through careful management of component lifecycle and render optimization.

5. **Optimizing Grid Operations with skipStateUpdate**

To prevent unnecessary re-renders and UI flickering when working with DataGrid components, implement the `skipStateUpdate` pattern in context CRUD methods.

### Purpose and Benefits

**The `skipStateUpdate` pattern should only be used when CRUD operations are NOT using the default ODataGrid data flow**. This occurs in two common scenarios:

1. When using a customDataSource instead of the direct endpoint parameter
2. When overriding the default grid behavior with `e.cancel = true` and custom handlers

When implemented properly, this pattern solves several key issues in DataGrid implementations:

1. **Prevents UI Flickering**: By avoiding simultaneous context state updates and grid refreshes
2. **Improves Performance**: Reduces unnecessary re-renders in the component tree
3. **Maintains Data Consistency**: Still invalidates React Query caches to ensure fresh data
4. **Separates Concerns**: Lets the grid manage its own update cycle while still informing the context of changes

### Implementation Pattern

```typescript
// In the entity context file
const updateEntity = useCallback(async (entity: Entity, skipStateUpdate = false): Promise<Entity> => {
  if (!user?.token) {
    throw new Error('User token is required');
  }
  
  try {
    // Only dispatch state updates if we're not skipping them
    if (!skipStateUpdate) {
      dispatch({ type: 'UPDATE_ENTITY_START', payload: entity });
    }
    
    const result = await updateEntityApi(entity, user.token);
    
    // Only update the context state if we're not skipping updates
    if (!skipStateUpdate) {
      dispatch({ type: 'UPDATE_ENTITY_SUCCESS', payload: result });
    }
    
    // Always invalidate queries regardless of skipStateUpdate
    // This ensures data consistency across the application
    queryClient.invalidateQueries({ queryKey: ['entities'] });
    
    return result;
  } catch (error) {
    if (!skipStateUpdate) {
      dispatch({ 
        type: 'UPDATE_ENTITY_ERROR', 
        payload: { 
          error: error instanceof Error ? error.message : 'Failed to update entity',
          entity 
        } 
      });
    }
    throw error;
  }
}, [user?.token, queryClient]);
```

### Common Data Flow Patterns

**Pattern 1: Grid-Managed Updates**

In this approach, the grid and context operate in parallel paths:

1. **ODataGrid**: Connects directly to the API endpoint for CRUD operations
2. **Context**: Provides business logic and specialized functions
3. **Grid Handlers**: Translate grid events to context method calls with `skipStateUpdate=true`

After completing a grid update with skipStateUpdate:

```typescript
// In grid handlers
const handleRowUpdating = useCallback((e: any) => {
  // Cancel default grid behavior
  e.cancel = true;
  
  const update = async () => {
    try {
      // Call context method with skipStateUpdate=true
      await updateEntity(updatedEntity, true);
      
      // Manual grid refresh after a small delay
      setTimeout(() => {
        if (e.component.hasEditData()) {
          e.component.cancelEditData();
        }
        e.component.getDataSource().reload();
      }, 50);
      
    } catch (error) {
      throw error; // Re-throw to DevExtreme for error handling
    }
  };
  
  // Return the update promise to DevExtreme
  return update();
}, [updateEntity]);
```

**Pattern 2: Direct API Pattern for Insert Operations**

For insert operations with skipStateUpdate, use a direct API call pattern:

```typescript
// In the context
const addEntity = useCallback(async (entity: Entity, skipStateUpdate = false): Promise<Entity> => {
  // ... validation logic ...
  
  try {
    if (skipStateUpdate && user?.token) {
      // Direct API call with minimal context interaction
      const result = await entityAdapter.create(entity, user.token);
      // Still invalidate queries for consistency
      queryClient.invalidateQueries({ queryKey: ['entities'] });
      return result;
    } else {
      // Standard context update path
      dispatch({ type: 'ADD_ENTITY_START', payload: entity });
      // ... rest of implementation ...
    }
  } catch (error) {
    // ... error handling ...
  }
}, [user?.token, queryClient]);
```

### When to Use skipStateUpdate

**Use the `skipStateUpdate` pattern when you've overridden the default ODataGrid data flow**. This pattern is specifically designed for scenarios where:

1. **Overridden Grid Events**: When using `e.cancel = true` in grid handlers to customize update/insert behavior
2. **Manual Grid Refreshes**: When you need to call `dataGridRef.current.refresh()` or `dataSource.reload()` manually
3. **Custom Endpoints**: When using specialized API endpoints instead of standard OData CRUD operations
4. **Complex State Transitions**: When entity updates involve status transitions or workflows that require custom logic
5. **Context-Managed Business Logic**: When the context needs to perform validation or transformation before saving

For standard reference data grids that use the ODataGrid with a direct endpoint parameter and don't override the default grid handlers, this pattern is unnecessary as the grid already manages its own updates efficiently.

**CRITICAL: skipStateUpdate Implementation Requirements**

1. **Context Method Signatures**: All CRUD methods in entity contexts should accept an optional `skipStateUpdate` parameter:
   ```typescript
   addEntity(entity: Entity, skipStateUpdate?: boolean): Promise<Entity>;
   updateEntity(entity: Entity, skipStateUpdate?: boolean): Promise<Entity>;
   ```

2. **Type Definitions**: Update interface definitions to include the optional parameter:
   ```typescript
   export interface EntityContextProps {
     // Other properties...
     updateEntity: (entity: Entity, skipStateUpdate?: boolean) => Promise<Entity>;
   }
   ```

3. **Grid Handler Usage**: When calling entity methods from grid handlers, always pass `skipStateUpdate=true` to prevent UI flickering:
   ```typescript
   // In grid handlers
   await entityContext.updateEntity(updatedEntity, true);
   ```

4. **Cache Invalidation**: Even when skipping state updates, always invalidate React Query caches to maintain data consistency across the application.

5. **Direct API Calls**: For insert operations with skipStateUpdate, you may need to implement direct API calls that bypass state updates while still ensuring all required data is sent.

6. **Grid Refresh Strategy**: After calling a context method with skipStateUpdate, implement a manual grid refresh strategy:
   ```typescript
   // Wait a short time before refreshing grid
   setTimeout(() => {
     // Cancel any pending edit operations first
     if (gridRef.current.hasEditData()) {
       gridRef.current.cancelEditData();
     }
     // Then reload the data source
     gridRef.current.getDataSource().reload();
   }, 50);
   ```

This pattern is essential for complex collection views with DataGrid components where context state updates can cause flickering and performance issues. All new collection views MUST follow this pattern for optimal performance and user experience.

