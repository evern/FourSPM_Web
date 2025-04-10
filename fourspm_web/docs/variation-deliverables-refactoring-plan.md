# Variation Deliverables Refactoring Plan

## Overview

This document outlines the plan for refactoring the Variation Deliverables component to align with the Collection View Implementation Doctrine. We will create a new implementation in `variation-deliverables-final.tsx` that will eventually replace the original component.

## Current Implementation Analysis

The current `variation-deliverables.tsx` implementation:

- Uses a controller-based approach (`useVariationDeliverableCollectionController`) rather than the Context + Reducer pattern
- Directly manages state and operations in the controller
- Lacks proper separation between data management and UI components
- Does not follow the two-layer component architecture (Main + Content)
- Does not leverage the DeliverableEditorContext effectively

## Target Architecture

Following the Collection View Implementation Doctrine, we will implement:

```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│     Main Component  │    │      Contexts       │    │    Data Sources      │
│                     │    │                     │    │                     │
│  variation-         │◄───┤variation-           │◄───┤variationDeliverable │
│  deliverables-final │    │deliverables-context │    │DataSource.ts        │
│  ├─ Content         │    │deliverable-editor-  │    │                     │
└─────────────────────┘    │context.tsx          │    └─────────────────────┘
```

## Type Definitions

The implementation will rely on several key types:

### 1. VariationDeliverableUiStatus

This essential type defines the possible UI states of a variation deliverable:

```typescript
export type VariationDeliverableUiStatus = 'Original' | 'Add' | 'Edit' | 'Cancel';
```

This type is used throughout the implementation to:
- Determine field editability based on status
- Control cancellation button behavior
- Handle different API calls based on status
- Apply appropriate UI styling

### 2. Deliverable Type

We'll use the existing Deliverable interface from odata-types.ts, ensuring it includes:
- guid: string
- variationGuid?: string
- originalDeliverableGuid?: string
- variationStatus?: string
- variationHours: number
- uiStatus?: VariationDeliverableUiStatus

## Implementation Steps

### Step 1: Create Variation Deliverables Types

1.1. Create or update interfaces for variation deliverables state management:
- `VariationDeliverablesState`
- `VariationDeliverablesAction`
- `VariationDeliverablesContextProps`

1.2. Verify `VariationDeliverableUiStatus` type is properly imported and used

### Step 2: Create Variation Deliverables Context

2.1. Create `variation-deliverables-context.tsx` file
2.2. Implement state interface with loading, error, and deliverables array
2.3. Create reducer function with action handlers for CRUD operations
2.4. Implement context provider with proper memoization
2.5. Migrate key functions from controller:
   - `loadDeliverables`
   - `addOrUpdateVariationDeliverable`
   - `cancelDeliverable` 
   - `addNewDeliverable`
2.6. Create custom hook for accessing context (`useVariationDeliverables`)

### Step 3: Create Grid Handlers Hook

3.1. Create `useVariationDeliverableGridHandlers.ts` file
3.2. Implement the following grid event handling functions:
   - `handleRowValidating`
   - `handleRowUpdating`
   - `handleRowInserting`
   - `handleInitNewRow`
   - `handleEditorPreparing`
   - `isFieldEditable`
   - `handleCancellationClick`
3.3. Ensure handlers connect to context functions properly

### Step 4: Create Variation Deliverables Component

4.1. Create `variation-deliverables-final.tsx` file
4.2. Implement main component with context providers:

```typescript
// Main component that sets up context providers
export function VariationDeliverablesFinal(): React.ReactElement {
  return (
    <VariationDeliverablesProvider>
      <DeliverableEditorProvider>
        <VariationDeliverablesContent />
      </DeliverableEditorProvider>
    </VariationDeliverablesProvider>
  );
}
```

4.3. Implement nested content component that consumes contexts:

```typescript
// Nested component that consumes contexts
const VariationDeliverablesContent = (): React.ReactElement => {
  // Implementation here
};
```

### Step 5: Implement Core Functionality

5.1. Set up route parameters and authentication
5.2. Connect to both contexts using hooks
5.3. Implement data provider hooks for lookup data
5.4. Set up grid component with proper configuration
5.5. Implement error handling and loading states
5.6. Connect to column definitions from existing files

## Key Functions to Migrate

### 1. addOrUpdateVariationDeliverable

```typescript
const addOrUpdateVariationDeliverable = useCallback(async (
  deliverableGuid: string, 
  variationHours: number, 
  originalDeliverableGuid?: string
): Promise<Deliverable> => {
  // Implementation details
}, [dependencies]);
```

### 2. loadDeliverables

```typescript
const loadDeliverables = useCallback(async () => {
  if (!variationGuid || !userToken) return;
  
  try {
    setDeliverablesLoading(true);
    const items = await getVariationDeliverables(variationGuid, userToken);
    setDeliverables(items);
    // Additional implementation details
  } catch (error) {
    // Error handling
  } finally {
    setDeliverablesLoading(false);
  }
}, [dependencies]);
```

### 3. cancelDeliverable

```typescript
const cancelDeliverable = useCallback(async (deliverableGuid: string, originalDeliverableGuid?: string) => {
  try {
    if (originalDeliverableGuid && originalDeliverableGuid !== deliverableGuid) {
      await removeDeliverableFromVariation(deliverableGuid, originalDeliverableGuid, userToken);
    } else {
      await cancelDeliverableVariation(deliverableGuid, userToken);
    }
    // Success handling
  } catch (error) {
    // Error handling
  }
}, [dependencies]);
```

### 4. handleCancellationClick

```typescript
const handleCancellationClick = useCallback(async (deliverable: Deliverable) => {
  const confirmed = await confirmCancellation(deliverable);
  if (!confirmed) return;
  
  try {
    switch (deliverable.uiStatus) {
      case 'Original':
        await cancelDeliverable(deliverable.guid, deliverable.guid);
        break;
      case 'Add':
        await cancelDeliverable(deliverable.guid);
        break;
      case 'Edit':
        await cancelDeliverable(deliverable.guid, deliverable.originalDeliverableGuid);
        break;
    }
  } catch (error) {
    console.error('Cancellation failed:', error);
  }
}, [dependencies]);
```

### 5. isFieldEditable

```typescript
const isFieldEditable = useCallback((fieldName: string, uiStatus: VariationDeliverableUiStatus) => {
  // Always readonly fields from shared constant
  if (ALWAYS_READONLY_DELIVERABLE_FIELDS.includes(fieldName)) {
    return false;
  }
  
  // For original deliverables, everything is read-only
  if (uiStatus === 'Original') {
    return false;
  }
  
  // For edited variations, only allow editing variation hours
  if (uiStatus === 'Edit') {
    return fieldName === 'variationHours';
  }
  
  // For new variations, most fields are editable except a few
  if (uiStatus === 'Add') {
    return fieldName !== 'budgetHours';
  }
  
  return false;
}, []);
```

### 6. Integration with Row Events

```typescript
const handleRowUpdating = useCallback(async (e: any) => {
  // Extract the data we need from the event
  const { oldData, newData } = e;
  
  try {
    // Only proceed if variationHours has changed
    if (newData.variationHours !== undefined && oldData.variationHours !== newData.variationHours) {
      let originalGuid;
      
      if (oldData.uiStatus === 'Original') {
        // For Original status rows, use the current GUID as the original GUID
        originalGuid = oldData.guid;
      } else if (oldData.uiStatus === 'Edit' && oldData.originalDeliverableGuid) {
        // For Edit status rows that already have an originalDeliverableGuid, use that
        originalGuid = oldData.originalDeliverableGuid;
      }
      
      // Call API and get updated entity
      const updatedEntity = await addOrUpdateVariationDeliverable(oldData.guid, newData.variationHours, originalGuid);
      
      // Update row with server response
      if (updatedEntity) {
        Object.assign(e.newData, updatedEntity);
      }
    }
  } catch (error) {
    console.error('Error updating deliverable:', error);
    e.cancel = true;
    // Error handling
  }
}, [dependencies]);
```

## DeliverableEditorContext Integration

Our implementation will leverage the existing DeliverableEditorContext by:

1. Using the `DeliverableEditorProvider` at the component level
2. Consuming `useDeliverableEditor()` hook in the Content component
3. Utilizing editor preparation handlers for field customization:
   - `handleDeliverableEditorPreparing`
   - `handleDeliverableInitNewRow`
4. Using document number generation functionality:
   - `fetchSuggestedDeliverableDocumentNumber`
   - `updateDeliverableDocumentNumber`

## Step 6: CancellationButtonRenderer Integration

6.1. Import the `renderCancellationButton` function from existing file
6.2. Create a callback that connects to context functions:
   ```typescript
   const onCancellationClick = useCallback((data: any) => {
     handleCancellationClick(data);
   }, [handleCancellationClick]);
   ```
6.3. Pass this callback to column definitions for the cancellation column
6.4. Verify the cancellation button responds correctly for different deliverable statuses

## Step 7: Testing Plan

7.1. Test data loading and display
   - Verify deliverables load correctly when component mounts
   - Check loading indicators display properly
   - Validate error handling for failed requests

7.2. Test adding new deliverables
   - Verify default values are populated correctly
   - Test document number generation
   - Confirm server validation works correctly

7.3. Test updating deliverables
   - Verify variation hours can be updated
   - Test field editability rules based on UI status
   - Confirm server-calculated fields update correctly

7.4. Test cancellation functionality
   - Test cancellation of original deliverables
   - Test removal of newly added deliverables
   - Test cancellation of edited deliverables
   - Verify confirmation dialog works correctly

7.5. Test integration with editor context
   - Verify document number generation works
   - Test field editability based on status
   - Check field value dependencies

## Step 8: Final Implementation

Once testing is complete, we will:

8.1. Refine performance
   - Review for unnecessary re-renders
   - Ensure proper memoization of context values
   - Verify correct dependency arrays in all useCallback/useMemo

8.2. Prepare for deployment
   - Update imports in dependent components
   - Run final tests to ensure all functionality works

8.3. Replace original implementation
   - Rename `variation-deliverables-final.tsx` to `variation-deliverables.tsx`
   - Update import references

8.4. Documentation
   - Update architectural documentation
   - Add comments explaining key implementation decisions
