# Deliverable Progress Refactoring Plan

This document outlines the plan for refactoring the deliverable-progress component to follow the same architectural pattern as the deliverables and variation-deliverables components.

## Objective

Improve the architecture of the deliverable-progress component by:
1. Decoupling grid handlers from context
2. Maintaining staggered loading pattern 
3. Properly separating concerns between context (state) and handlers (behavior)

## Reference Implementation

The refactored deliverables implementation in `src/pages/deliverables/deliverables.tsx` shows the target architecture:

```tsx
// DeliverablesProvider handles first level of loading (project data)
export function DeliverablesProvider({ children, projectId: projectIdProp }) {
  // Get project data with useProjectInfo
  const { project, isLoading: projectLoading } = useProjectInfo(projectId, user?.token);
  
  // Only render full content after project is loaded
  if (projectLoading) {
    return <DeliverablesContext.Provider value={loadingContextValue}>
      {children}
    </DeliverablesContext.Provider>;
  }
  
  return <DeliverablesContent projectId={projectId} project={project} user={user}>
    {children}
  </DeliverablesContent>;
}

// Component gets state/data from context but grid handlers directly
const DeliverablesContent = () => {
  // Get state and data providers from context
  const { state, project, areasDataSource, ... } = useDeliverables();
  
  // Get user auth for API calls
  const { user } = useAuth();
  
  // Get grid handlers directly (not from context)
  const { handleRowUpdating, ... } = useDeliverableGridHandlers({
    projectGuid: state.projectGuid || '',
    userToken: user?.token,
    project
  });

  // Create grid columns when data providers are ready
  const columns = useMemo(() => {
    if (isLookupDataLoading) return [];
    return createDeliverableColumns(...);
  }, [dataProviderDependencies]);
};
```

## Execution Steps

### 1. Update DeliverableProgressContextProps Interface

1.1. Remove grid event handlers from context interface:
- `handleRowUpdating`
- `handleRowValidating`
- `handleEditorPreparing`
- `handleGridInitialized`

1.2. Keep period-related functions as core state management:
- `setSelectedPeriod`
- `incrementPeriod`
- `decrementPeriod`
- `selectedPeriod`
- `progressDate`

### 2. Update DeliverableProgressContext Implementation

2.1. Remove grid handler implementation from `DeliverableProgressProvider`

2.2. Focus context on data providers and state:
- Maintain staggered loading with `useProjectInfo` -> data providers -> UI
- Keep data providers in context (shared state)
- Continue using period manager logic in context

2.3. Update the context value object to only include:
- State (loading, error, etc.)
- Period management functions and values
- Data providers

### 3. Create/Update DeliverableProgressGridHandlers

3.1. Create dedicated grid handlers hook if not exists:
```typescript
export function useDeliverableProgressGridHandlers(options: {
  projectGuid: string;
  userToken?: string;
  selectedPeriod: any;
}): DeliverableProgressGridHandlers
```

3.2. Ensure it returns all grid-related handlers:
- `handleRowUpdating`
- `handleRowValidating`
- `handleEditorPreparing`
- `handleGridInitialized`

3.3. Move authentication logic from context to grid handlers

### 4. Update DeliverableProgress Component

4.1. Get state/data providers from context:
```tsx
const {
  state,
  selectedPeriod,
  progressDate,
  incrementPeriod,
  decrementPeriod
} = useDeliverableProgress();
```

4.2. Get grid handlers directly:
```tsx
const { user } = useAuth();

const {
  handleRowUpdating,
  handleRowValidating,
  handleEditorPreparing,
  handleGridInitialized
} = useDeliverableProgressGridHandlers({
  projectGuid: state.projectGuid || '',
  userToken: user?.token,
  selectedPeriod
});
```

4.3. Keep the sequential loading pattern intact, following deliverables.tsx implementation:

```tsx
// First level in Provider: load project data
const { project, isLoading: projectLoading } = useProjectInfo(projectId, user?.token);

// Second level in Component: load data providers when project is available
const shouldLoadProviders = !!project && !!projectId;
const { areasDataSource } = useAreaDataProvider(
  shouldLoadProviders ? projectId : undefined
);

// Third level: only render grid when all data is loaded
const shouldRenderGrid = !isLoading && !!columns.length;

{shouldRenderGrid && (
  <ODataGrid ... />
)}
```

### 5. Testing and Debugging

5.1. Verify authentication is working
- Check user token is properly passed to API calls
- Test for any authentication/session errors

5.2. Validate data loading sequence
- Project data should load first
- Then data providers should initialize
- Grid should only render when all data is available

5.3. Test grid operations
- Ensure CRUD operations work correctly
- Verify period selection affects grid data as expected

## Implementation Considerations

1. **Keep period management in context**
   - Period selection is core state that affects multiple components
   - The period manager is a specialized state manager that should remain in context

2. **Pass period information to grid handlers**
   - Grid operations (especially updates) will need period context
   - Ensure grid handlers have access to current period when needed

3. **Maintain backward compatibility**
   - Follow the pattern established in the successful deliverables refactoring

## Benefits

- Code is more maintainable with clear separation of concerns
- Follows consistent pattern across the application
- Reduces context API surface area to only what's necessary
- Makes dependencies explicit in component usage
- Preserves the optimized loading sequence that prevents unnecessary API calls
