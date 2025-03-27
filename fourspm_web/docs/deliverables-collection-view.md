# Collection View Implementation Doctrine

This document defines the standard architecture and implementation patterns for collection views in the FourSPM Web application. All new collection views MUST follow these patterns to ensure consistency, maintainability, and scalability.

## Standard Architecture

Every collection view in the application MUST be built using the following interconnected components with clear separation of concerns:

```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│     Component       │    │     Controllers      │    │      Adapters        │
│                     │    │                     │    │                     │
│  {entity}.tsx       │◄───┤use{Entity}Collection│◄───┤{entity}.adapter.ts  │
│                     │    │Controller.ts        │    │                     │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
          ▲                           ▲                          ▲
          │                           │                          │
          │                           │                          │
          │                           │                          │
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   View Definition   │    │    Data Providers   │    │   API Endpoints     │
│                     │    │                     │    │                     │
│ {entity}-columns.ts │    │use{LookupEntity}Data│    │  api-endpoints.ts   │
│                     │    │Provider.ts          │    │                     │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
```

Where `{entity}` is replaced with the specific entity name (e.g., deliverable, project, area).

## Required Components

### 1. View Component (`{entity}.tsx`)

The view component MUST:

- Use `useParams` to extract entity context (e.g., projectId) from the URL
- Implement the appropriate collection controller hook
- Use data provider hooks for all lookup data
- Render the `ODataGrid` component with standardized handlers
- Include proper error handling and loading states

**Required implementation:**
```typescript
const {EntityName}: React.FC = () => {
  const { contextId } = useParams<EntityParams>();
  const { user } = useAuth();
  const endpoint = {ENTITY}_ENDPOINT;

  // Use the entity controller
  const {
    handleEditorPreparing,
    handleRowUpdating,
    handleRowRemoving,
    handleRowInserting,
    handleRowValidating,
    handleInitNewRow,
    handleGridInitialized
  } = use{Entity}CollectionController(
    user?.token,
    contextId,
    { endpoint, onDeleteError, onUpdateError }
  );

  // Use data providers for lookups
  const { lookupDataSource } = useLookupDataProvider();
  
  // Create columns with data sources
  const columns = create{Entity}Columns(lookupDataSource);

  return (
    <ODataGrid
      endpoint={endpoint}
      columns={columns}
      keyField="guid"
      onRowUpdating={handleRowUpdating}
      onInitNewRow={handleInitNewRow}
      onRowValidating={handleRowValidating}
      onRowRemoving={handleRowRemoving}
      onRowInserting={handleRowInserting}
      onEditorPreparing={handleEditorPreparing}
      onInitialized={handleGridInitialized}
      defaultFilter={[['contextField', '=', contextId]]}
    />
  );
};
```

### 2. Controller Hook (`use{Entity}CollectionController.ts`)

This hook MUST manage the data operations and business logic:

- Define validation rules for entity fields
- Provide implementations for all grid operation handlers
- Implement editor customization for special fields
- Handle any entity-specific business logic
- Properly handle project or parent entity context when applicable

**Interface Definition:**
The controller interface definition is CRITICAL as it clearly documents all functionality provided by the controller and allows developers to quickly understand the differences between various entity controllers:

```typescript
/**
 * Interface for {Entity} collection controller hook (for grid/list operations)
 */
export interface {Entity}CollectionControllerHook extends GridOperationsHook<{Entity}> {
  // Entity-specific collection operations
  handleInitNewRow: (e: any) => void;
  
  // Data providers that this controller exposes
  lookupStore: ODataStore;
  
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
  // Project-specific collection operations
  handleInitNewRow: (e: any) => void;
  // Client data - only expose what's needed
  clientsStore: ODataStore;
  // Auto increment properties
  refreshNextNumber: () => void;
}
```

**Controller structure:**
```typescript
// Base controller without context
export function use{Entity}CollectionController(
  userToken: string | undefined,
  gridConfig?: GridOperationsConfig,
  validationRules: ValidationRule[] = DEFAULT_VALIDATION_RULES
): EntityCollectionControllerHook {
  // Implementation
}

// Enhanced controller with context (if needed)
export function useContext{Entity}CollectionController(
  userToken: string | undefined,
  contextId?: string,
  gridConfig?: GridOperationsConfig,
  validationRules: ValidationRule[] = DEFAULT_VALIDATION_RULES
): ContextEntityCollectionControllerHook {
  // Implementation using base controller
}
```

### 3. Columns Definition (`{entity}-columns.ts`)

Column definitions MUST:

- Be isolated in a separate file
- Use a factory function to create columns with injected lookup sources
- Include proper typing with `ODataGridColumn`
- Configure consistent hiding priorities
- Use standard lookup configurations for dropdown fields

**Column definition pattern:**
```typescript
export const create{Entity}Columns = (
  lookup1DataSource: any,
  lookup2DataSource: any
): ODataGridColumn[] => {
  return [
    {
      dataField: 'field1',
      caption: 'Field 1',
      hidingPriority: 1
    },
    {
      dataField: 'lookupField',
      caption: 'Lookup Field',
      hidingPriority: 2,
      lookup: {
        dataSource: lookup1DataSource,
        valueExpr: 'id',
        displayExpr: 'name'
      }
    },
    // Additional columns
  ];
};
```

### 4. Data Providers (`use{LookupEntity}DataProvider.ts`)

Data provider hooks MUST:

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

The Deliverables collection view serves as a reference implementation that adheres to these standards. Refer to the following files for examples:

- View Component: `src/pages/deliverables/deliverables.tsx`
- Controller: `src/hooks/controllers/useDeliverableCollectionController.ts`
- Columns: `src/pages/deliverables/deliverable-columns.ts`
- Data Providers: 
  - `src/hooks/data-providers/useDisciplineDataProvider.ts`
  - `src/hooks/data-providers/useDocumentTypeDataProvider.ts`
- Adapter: `src/adapters/deliverable.adapter.ts`
