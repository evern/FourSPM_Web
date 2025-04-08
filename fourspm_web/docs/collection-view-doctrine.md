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
│ {entity}-columns.ts │    │ grid-handlers/     │    │  api-endpoints.ts   │
│                     │    │ grid-editors/       │    │                     │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
```

Where `{entity}` is replaced with the specific entity name (e.g., deliverable, project, area).

This architecture includes specialized components with clear responsibilities:

1. **Data Context** (`{entity}-context.tsx`): Handles data access, CRUD operations, and application state management
2. **Editor Context** (`{entity}-editor-context.tsx`): Manages editor field behaviors, validation, and generation of fields like document numbers
3. **Grid Handlers** (`use{Entity}GridHandlers.ts`): Centralizes grid event handling with proper type safety
4. **Grid Editors** (`use{Entity}GridEditor.ts`): Provides specialized editor preparation and field customization
5. **Grid Validators** (`use{Entity}GridValidator.ts`): Contains business validation logic separated from UI concerns

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
- Use the editor context via a custom hook (e.g., `useDeliverableEditor`)
- Implement grid event handlers from dedicated hooks
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
  
  // Combine grid handler with editor context functionality
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
  }
  return context;
}
```

### 4. Grid Handlers Hook (`use{Entity}GridHandlers.ts`)

This hook MUST provide all necessary grid event handlers:

- Implement handlers for row validating, updating, inserting, removing, and initializing new rows
{{ ... }}
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

## Specialized Hooks Architecture

The application uses specialized hooks organized by functionality to ensure clean separation of concerns and optimal reusability:

### 1. Grid Handlers

Grid handlers MUST:  
- Be located in `/src/hooks/grid-handlers/`
- Implement strong type safety with properly typed events
- Handle all grid operations (validating, updating, inserting, etc.)
- Return a consistent interface of handlers through composition

```typescript
// Example Grid Handlers Hook
export function useEntityGridHandlers(options: EntityHandlerOptions): EntityGridHandlers {
  // Use specialized validator hook
  const { validateEntity, handleRowValidating } = useEntityGridValidator(options);
  
  // Use specialized editor hook
  const { handleEditorPreparing, handleInitNewRow } = useEntityGridEditor(options);
  
  // Return consolidated API with consistent naming
  return {
    handleRowValidating,
    handleRowUpdating,
    handleRowInserting,
    handleInitNewRow,
    handleEditorPreparing,
    validateEntity
  };
}
```

### 2. Grid Editors

Grid editors MUST:
- Be located in `/src/hooks/grid-editors/`
- Focus on editor preparation and field customization
- Implement specialized business logic for field generation
- Utilize parameter objects for function arguments

### 3. Grid Validators

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

## Component Structure and Paths

All collections views MUST follow this component structure and file organization:

| Component Type | Path Pattern | Purpose |
|---------------|--------------|---------|
| Main Component | `/src/pages/{entity}/{entity}.tsx` | Provides context, renders content component |
| Content Component | Nested in main component | Consumes contexts, renders UI elements |
| Data Context | `/src/contexts/{entity}/{entity}-context.tsx` | Manages data state and CRUD operations |
| Data Context Types | `/src/contexts/{entity}/{entity}-types.ts` | Defines interfaces for state, actions, context |
| Data Context Reducer | `/src/contexts/{entity}/{entity}-reducer.ts` | Handles state transitions and actions |
| Editor Context | `/src/contexts/editor/{entity}-editor-context.tsx` | Manages editor behaviors and field generation |
| Editor Context Types | `/src/contexts/editor/{entity}-editor-types.ts` | Defines interfaces for editor state and actions |
| Grid Handlers | `/src/hooks/grid-handlers/use{Entity}GridHandlers.ts` | Coordinates grid events and behaviors |
| Grid Validators | `/src/hooks/grid-handlers/use{Entity}GridValidator.ts` | Contains validation logic and rules |
| Grid Editors | `/src/hooks/grid-editors/use{Entity}GridEditor.ts` | Handles field customization and document generation |
| Data Providers | `/src/hooks/data-providers/use{LookupEntity}DataProvider.ts` | Provides lookup/reference data |
| Columns | `/src/pages/{entity}/{entity}-columns.ts` | Defines grid column configuration |
| Adapters | `/src/adapters/{entity}.adapter.ts` | Contains API interaction methods |
| Models/Types | `/src/types/odata-types.ts` or `/src/types/{entity}-types.ts` | Defines entity interfaces |
| API Endpoints | `/src/config/api-endpoints.ts` | Centralizes endpoint URLs |

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

### 2. Projects Module
- View Component: `src/pages/projects/projects.tsx`
- Context: `src/contexts/projects/projects-context.tsx`
- Context Types: `src/contexts/projects/projects-types.ts`
- Grid Handlers: `src/hooks/grid-handlers/useProjectGridHandlers.ts` 
- Data Source: `src/stores/clientDataSource.ts`
- Columns: `src/pages/projects/project-columns.ts`


