# Token Handling Patterns in FourSPM Web

## Overview

This document outlines the token handling pattern to be used across all features in the FourSPM Web application. It establishes the Optimized Direct Access pattern as the recommended approach going forward.

## Optimized Direct Access Pattern

### Core Principles

1. **Direct Access Only in Leaf Methods**: Only get tokens at the leaf level when they are immediately needed for network requests.
2. **No Token State**: Never store token as component or context state.
3. **No Token Props**: Components should not receive tokens as props.
4. **No Token Dependencies**: Remove token from dependency arrays in hooks and callbacks.
5. **No Token Comments**: Do not add comments about token handling - clean code should be self-explanatory.

### What is a Leaf Method?

A leaf method is one that directly makes a network request requiring authentication. Examples include:

- Adapter functions that call API endpoints
- `beforeSend` handlers in ODataStore or ODataGrid
- Network request handlers in utility hooks

### Implementation Examples

#### Adapters (Leaf Methods)

```tsx
// In adapter function (deliverable.adapter.ts)
export const getSuggestedDocumentNumber = async (...) => {
  // Get token directly only when making the request
  const token = getToken();
  
  // Use token for API call
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  
  const response = await fetch(url, { headers });
  // Process response...
};
```

#### ODataStore beforeSend (Leaf Method)

```tsx
// In odataStores.ts
beforeSend: async (options: any) => {
  console.log('ODataStore: beforeSend called');
  
  try {
    // Get token directly from token-store
    const token = getToken();
    if (!token) {
      console.error('ODataStore: No valid token available!');
      // Handle missing token case
    } else {
      // Initialize headers if they don't exist
      if (!options.headers) {
        options.headers = {};
      }

      // Add the token to the Authorization header
      options.headers['Authorization'] = `Bearer ${token}`;
    }
    return true;
  } catch (error) {
    console.error('ODataStore: Error in beforeSend:', error);
    return true;
  }
}
```

#### Utility Hooks (Leaf Methods)

```tsx
// In useAutoIncrement.ts
export const useAutoIncrement = ({
  endpoint,
  field,
  padLength = 2,
  startFrom = '01',
  filter
}: UseAutoIncrementProps) => {
  // No token parameter
  
  const getNextNumber = useCallback(async () => {
    try {
      // Token only retrieved when making the request
      const token = getToken();
      if (!token) {
        console.error('useAutoIncrement: No token available');
        return startFrom;
      }
      
      // Use token for request
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      };
      
      const response = await fetch(urlString, { headers });
      // Process response...
    } catch (error) {
      return startFrom;
    }
  }, [endpoint, field, filter, padLength, startFrom]); // No token dependency
  
  // Rest of the hook implementation...
};
```

### Context Implementation

```tsx
// No token imports or state in context
// No token-related useEffects
// No token in the context value

// For operations that need a token, get it directly at the point of use
const fetchData = useCallback(async () => {
  try {
    // Call adapter function which handles token internally
    const data = await getSomeData(params);
    // Process data...
  } catch (error) {
    // Handle error...
  }
}, [params]);
```

### Component Implementation with ODataGrid

```tsx
// In a feature component (areas.tsx)
const AreasContent = React.memo((): React.ReactElement => {
  // No token state or token-related imports
  
  // ODataGrid handles token retrieval internally through beforeSend
  return (
    <ODataGrid
      // No token prop - handled internally by ODataGrid
      // No onTokenExpired prop - token refresh is handled by the application
      endpoint={AREAS_ENDPOINT}
      columns={areaColumns}
      keyField="guid"
      onRowUpdating={handleRowUpdating}
      // Other props...
    />
  );
});
```

## Migration Guide

### Step 1: Update Leaf Methods

1. Identify all leaf methods (adapter functions, beforeSend handlers, network request hooks)
2. Modify them to get the token directly using `getToken()` at the point of use
3. Remove token parameters from their interfaces
4. Do not add comments explaining token access - code should be self-documenting

### Step 2: Update Component Hooks

1. Identify hooks that accept token as a parameter (e.g., `useAutoIncrement`)
2. Remove the token parameter and update to use direct token access
3. Remove token from dependency arrays
4. Don't include comments about token removal or access pattern

### Step 3: Update Contexts

1. Remove all token state management from contexts
2. Remove token-related effects
3. Remove token from context values
4. Remove all token-related comments (like '// No token in state', '// Token accessed directly')

### Step 4: Update Components

1. Remove token imports and state from components
2. Remove token props from child components (ODataGrid, etc.)
3. Remove onTokenExpired handlers and props
4. Don't add explanatory comments about token handling changes

### No Token Comments Principle

The 'No Token Comments' principle is an important part of the Optimized Direct Access pattern. Comments about token access are unnecessary and can lead to code clutter and maintenance issues:

1. **Avoid Explanatory Comments**: Don't add comments like '// No token in state', '// Token accessed directly', or '// Token management removed'.

2. **Self-Documenting Code**: The code should be clear enough that token access patterns are obvious without comments. Direct calls to `getToken()` at the leaf level are self-explanatory.

3. **Clean State Interfaces**: State interfaces shouldn't include token fields with explanatory comments. Simply remove token-related fields entirely.

4. **Clean Initialization**: When initializing state, don't add comments about token absence. The lack of a token property in the state is sufficient.

5. **Function Parameters**: Don't add comments about removed token parameters. Their absence in function signatures is sufficient documentation.

## Benefits

- **Simplified Code**: Less token-related plumbing throughout the application
- **Better Performance**: Fewer re-renders from token state changes
- **Improved Consistency**: Uniform token handling across all features
- **Reduced Prop Drilling**: No need to pass token props down component trees
- **Better Testing**: Components and hooks have fewer dependencies
- **Lower Memory Usage**: No redundant token state storage across contexts
- **Centralized Token Management**: All token-related logic in the token-store
- **Cleaner Codebase**: No unnecessary token-related comments cluttering the code
