# API Services Documentation

## Overview

This directory contains shared API services and documentation for the FourSPM Web application. The architecture uses a layered approach to provide both direct API access and reusable services.

## Architecture

FourSPM Web's API services are organized into the following layers:

1. **Base Layer**: Core functionality for HTTP requests and response handling.
2. **Shared Layer**: Common services used across the application, including an OData client.
3. **Adapter Layer**: Entity-specific adapters that transform data between API and frontend formats, encapsulate entity-specific business logic, and handle complex multi-step operations.
4. **Domain Layer**: Domain-specific services for each entity type (e.g., Projects, Deliverables).
5. **Controller Hook Layer**: Specialized hooks that combine domain services, adapters and component lifecycle for managing UI operations.

### Base Layer

The `base-api.service.ts` file implements a BaseApiService class that:
- Provides a generic request method for RESTful API requests
- Handles authentication token management
- Provides consistent error handling and logging
- Exports both a singleton instance and a backward-compatibility function

### Shared Layer

The `shared-api.service.ts` file implements a SharedApiService class that:

- Provides generic methods for common operations (getById, getAll, update, post)
- Handles error handling and token validation consistently
- Exports a singleton instance for use across the application
- Manages API response formats including both direct entity responses and collections

### Adapter Layer

The Adapter Layer contains entity-specific adapter modules that serve as an intermediary between the raw API services and controller hooks. Adapters are responsible for:

- Transforming data between API and frontend formats
- Encapsulating entity-specific business logic
- Handling complex operations that may involve multiple API calls
- Providing consistent error handling for entity operations

Adapters are typically imported by controller hooks and used to perform specialized operations. For example:

```typescript
// Example from progress.adapter.ts
export const handleProgressUpdate = async (
  deliverableGuid: string,
  newData: Partial<DeliverableProgressDto>,
  currentPeriod: number,
  oldData: Partial<DeliverableProgressDto>
): Promise<void> => {
  // Complex operation logic that may involve multiple API calls
  // Data transformation between formats
  // Specialized error handling
};
```

### Domain Layer

Domain service files implement business logic and act as facades for the SharedApiService:

- `progress.service.ts` - Handles updating progress percentage for deliverables
- `project.service.ts` - Manages project data retrieval and formatting
- `deliverable-gate.service.ts` - Handles deliverable gate operations
- `auth.service.ts` - Manages user authentication, session handling, and account operations

### Controller Hook Layer

Controller hooks combine domain services with React component lifecycle management:

- `useDeliverableController.ts` - Provides state and handlers for deliverable CRUD operations
- `useProgressController.ts` - Offers handlers for progress updates with validation
- `useProjectEntityController.ts` - Manages project data state and current period calculations
- `useDeliverableGatesController.ts` - Provides state for deliverable gates data

Controller hooks are specialized to specific use cases and handle:
- Form state management
- Grid row operations (insert, update, delete)
- Validation logic
- Error handling and user feedback

### UI Component Integration

The `ODataGrid` component provides direct integration with OData endpoints:
- Handles CRUD operations through the OData protocol
- Provides validation and custom editing capabilities
- Integrates with controller hooks for specialized business logic

## Related Documentation

For detailed implementation guidelines, refer to:

- [Single Entity CRUD Module](./single-entity-crud-module.md) - How to create modules for managing individual entity instances
- [Collection CRUD Module](./collection-crud-module.md) - How to create modules for managing collections of entities

## Usage Examples

### Using Controller Hooks

```typescript
import { useDeliverableControllerWithProject } from '../hooks/controllers/useDeliverableController';

function DeliverableComponent() {
  const { 
    handleRowUpdating, 
    handleRowRemoving, 
    handleRowInserting,
    onRowValidating,
    handleInitNewRow,
    handleEditorPreparing,
    handleGridInitialized,
    project
  } = useDeliverableControllerWithProject(
    userToken,
    projectId,
    {
      endpoint,
      onDeleteError: (error) => console.error('Error:', error),
      onUpdateError: (error) => console.error('Error:', error)
    }
  );
  
  // Component rendering using the controller hooks...
}
```

### Using the auth service

```typescript
import { signIn, signOut, getUser } from '../services/auth.service';

// Sign in a user
const result = await signIn('user@example.com', 'password');
if (result.isOk && result.data) {
  const user = result.data;
  // User is now authenticated
}

// Get current user
const { isOk, data: user } = await getUser();
```

### Using the progress service

```typescript
import { handleProgressUpdate } from '../services/progress.service';

// Update progress for a deliverable
await handleProgressUpdate(
  deliverableGuid,
  { totalPercentageEarnt: 0.75 }, // 75% complete
  currentPeriod,
  previousRowData
);
```

### Using the shared API service directly

```typescript
import { sharedApiService } from './services/api/shared-api.service';

// Fetch all deliverable gates
const gates = await sharedApiService.getAll('/odata/v1/DeliverableGates', userToken);

// Fetch an entity by ID
const project = await sharedApiService.getById(
  '/odata/v1/Projects', 
  projectId, 
  userToken
);

// Post data to a custom endpoint
const result = await sharedApiService.post(
  '/odata/v1/Progress/AddOrUpdateExisting',
  token,
  progressData
);
```

### Using the base API service directly

```typescript
import { baseApiService } from './services/api/base-api.service';

// Make a generic API request
const response = await baseApiService.request(
  'https://api.example.com/resource',
  {
    method: 'POST',
    body: JSON.stringify(data)
  }
);

const result = await response.json();
```

### Using the ODataGrid component

```tsx
<ODataGrid
  title="Project Deliverables"
  endpoint={`${API_CONFIG.baseUrl}/odata/v1/Deliverables`}
  columns={columnsConfig}
  keyField="guid"
  defaultFilter={[['projectGuid', '=', projectId]]}
  allowUpdating={true}
  onRowUpdating={handleRowUpdating}
  onRowValidating={handleRowValidating}
  onRowInserting={handleRowInserting}
  onRowRemoving={handleRowRemoving}
/>
```

## Debugging and Error Handling

The service layers include comprehensive error handling and logging:

- Console logging of request/response data for debugging
- Consistent error propagation through the service layers
- Validation of inputs before making API calls
- Token authentication verification

## OData Stores

The `odataStores.ts` file provides pre-configured DevExtreme ODataStore instances that are used for grid data sources and other components that require OData integration.
