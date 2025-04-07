# Collection View Implementation Doctrine

This document defines the standard architecture and implementation patterns for collection views in the FourSPM Web application. All new collection views MUST follow these patterns to ensure consistency, maintainability, and scalability.

## Standard Architecture

Every collection view in the application MUST be built using the Context + Reducer pattern for clean separation of concerns and optimized performance:

```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│     Component       │    │      Context        │    │    Data Sources      │
│                     │    │                     │    │                     │
│  {entity}.tsx       │◄───┤{entity}-context.tsx │◄───┤{entity}DataSource.ts│
│                     │    │                     │    │                     │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
          ▲                           ▲                          ▲
          │                           │                          │
          │                           │                          │
          │                           │                          │
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   View Definition   │    │   Event Handlers    │    │   API Endpoints     │
│                     │    │                     │    │                     │
│ {entity}-columns.ts │    │use{Entity}Grid      │    │  api-endpoints.ts   │
│                     │    │Handlers.ts          │    │                     │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
```

Where `{entity}` is replaced with the specific entity name (e.g., deliverable, project, area).

## Required Components

### 1. View Component (`{entity}.tsx`)

The view component MUST:

- Use the entity context via a custom hook (e.g., `useProjects`)
- Implement grid event handlers from a dedicated hook
- Use data source hooks for all lookup data
- Render the `ODataGrid` component with standardized handlers
- Include proper error handling and loading states

**Required implementation:**
```typescript
export function EntityName(): React.ReactElement {
  // Get everything we need from the entity context
  const { 
    state, 
    validateEntity
  } = useEntity();
  
  // Use the singleton data source with loading tracking
  const lookupDataSource = useLookupDataSource();
  const [dataLoaded, setDataLoaded] = useState(false);
  
  // Get all the grid event handlers from our custom hook
  const { 
    handleRowValidating,
    handleRowUpdating,
    handleRowInserting,
    handleRowRemoving,
    handleInitNewRow
  } = useEntityGridHandlers({
    validateEntity
  });

  // Create entity columns directly with the data source
  // No need for useMemo as column creation is fast enough
  // and ODataGrid handles optimization internally
  
  // Wait for data to load before initializing the grid
  useEffect(() => {
    lookupDataSource.waitForData()
      .then(() => setDataLoaded(true))
      .catch(() => setDataLoaded(true)); // Allow UI to proceed even on error
  }, [lookupDataSource]);

  return (
    <div className="entity-container">
      {/* Error handling */}
      {state.error && (
        <div className="alert alert-danger">
          Error: {state.error}
        </div>
      )}
      
      {/* Loading indicators */}
      <LoadPanel 
        visible={state.loading || !dataLoaded} 
        message={state.loading ? 'Loading...' : 'Loading reference data...'}
        position={{ of: '.entity-grid' }}
      />
      
      <div className="entity-grid">
        <div className="grid-custom-title">Entities</div>
        
        {/* Only render the grid once data is loaded */}
        {dataLoaded && (
          <ODataGrid
            endpoint={ENTITY_ENDPOINT}
            columns={createEntityColumns(lookupDataSource)}
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

### 3. Grid Handlers Hook (`use{Entity}GridHandlers.ts`)

This hook MUST provide all necessary grid event handlers:

- Implement handlers for row validating, updating, inserting, removing, and initializing new rows
- Use the entity context's validation functionality
- Handle any entity-specific business logic

**Interface Definition:**
```typescript
export interface GridHandlers {
  handleRowValidating: (e: any) => void;
  handleRowUpdating: (e: any) => void;
  handleRowInserting: (e: any) => void;
  handleRowRemoving: (e: any) => void;
  handleInitNewRow: (e: any) => void;
  
  // Any specialized operations for this entity type
  specializedOperation: (id: string) => Promise<void>;
}
```

**Example from Project controller:**
```typescript
/**
 * Interface for Project collection controller hook (for grid/list operations)
 */
export interface ProjectCollectionControllerHook extends GridOperationsHook<Project> {
- Follow the naming convention `use{Entity}DataProvider`
- Manage loading, caching, and error handling of reference data
- Return both raw data arrays and DevExtreme DataSource objects
- Provide utility methods for finding items by ID or code
- Use centralized API endpoint constants

**Data provider pattern:**
```typescript
export const use{LookupEntity}DataProvider = (
  contextId?: string
): {LookupEntity}DataProviderResult => {
  const [data, setData] = useState<{LookupEntity}[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Use the centralized store
  const store = useODataStore({LOOKUP_ENTITY}_ENDPOINT);
  
  // Create DataSource for DevExtreme
  const dataSource = useMemo(() => ({
    store: store
  }), [store]);
  
  // Load data
  useEffect(() => {
    // Implementation
  }, [store]);
  
  // Helper methods
  const getById = useCallback((id: string) => {
    // Implementation
  }, [data]);
  
  return {
    data,
    store,
    dataSource,
    isLoading,
    error,
    getById
  };
};
```

### 5. Adapter (`{entity}.adapter.ts`)

Adapters MUST:

- Define the entity interface matching the backend model
- Provide methods for all CRUD operations
- Implement specialized methods for custom operations
- Use centralized API endpoint constants
- Handle OData query parameters and filters consistently

**Adapter pattern:**
```typescript
// Entity interface
export interface {Entity} {
  guid: string;
  // Other fields
}

// Standard CRUD methods
export const get{Entities} = async (
  token: string,
  contextId?: string
): Promise<{Entity}[]> => {
  // Implementation using sharedApiService
};

// Specialized methods
export const {specialOperation} = async (
  params: any,
  token: string
): Promise<any> => {
  // Implementation
};
```

## Implementation Guidelines

### Data Flow Standards

1. **Initialization Flow:**
   - Component MUST initialize controller and data providers
   - Data providers MUST load lookup data on mount
   - Controller MUST prepare all grid configuration and handlers
   - ODataGrid MUST handle the actual data fetching

2. **Data Loading Flow:**
   - ALWAYS use the ODataGrid's built-in loading mechanism
   - NEVER duplicate data loading logic in the component

3. **Editing Flow:**
   - ALL validation MUST be defined in the controller's validation rules
   - Field customization MUST be handled in the controller's `handleEditorPreparing`
   - NEVER manipulate grid data directly, ALWAYS use controller methods

### Design Principles

1. **Separation of Concerns:**
   - View components MUST only handle rendering
   - Controllers MUST handle all business logic and state
   - Data providers MUST handle all reference data
   - Adapters MUST handle all API communication

2. **Centralized Configuration:**
   - ALL API endpoints MUST be defined in api-endpoints.ts
   - ALL validation rules MUST be defined at the controller level
   - ALL column definitions MUST be isolated in their own file

3. **Component Composition:**
   - ALWAYS use composition over inheritance
   - Base hooks SHOULD be combined with specialized hooks through composition
   - REUSE common grid utilities and entity operations

### Error Handling

1. All components MUST implement proper error handling:
   - Controllers MUST log errors and provide error callbacks
   - Components SHOULD display appropriate error messages
   - Data providers MUST manage and expose error states

2. Loading states MUST be properly managed and exposed to the UI

## Implementation Checklist

When implementing a new collection view, follow these steps:

1. [ ] Create the adapter with entity interface and CRUD methods
2. [ ] Add any required API endpoints to api-endpoints.ts
3. [ ] Implement data provider hooks for lookup data
4. [ ] Create the controller hook with validation rules and handlers
5. [ ] Define columns in a separate file
6. [ ] Implement the view component
7. [ ] Add the route to app-routes.tsx
8. [ ] Test all CRUD operations

## Example Implementation

The Projects module serves as a reference implementation that adheres to this architecture pattern. Refer to the following files for examples:

- View Component: `src/pages/projects/projects.tsx`
- Context: `src/contexts/projects/projects-context.tsx`
- Context Types: `src/contexts/projects/projects-types.ts`
- Grid Handlers: `src/hooks/data-providers/useProjectGridHandlers.ts`
- Data Source: `src/stores/clientDataSource.ts`
- Columns: `src/pages/projects/project-columns.ts`


