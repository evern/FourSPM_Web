# Collection CRUD Module Documentation

## Overview

This document provides a guide for creating collection CRUD (Create, Read, Update, Delete) modules in the FourSPM Web application. Collection views display multiple entity instances in a grid format, allowing users to view, edit, add, and delete records.

For information about the underlying API service architecture, please refer to the [API Services Documentation](./api-services-documentation.md).

## Architecture

Collection CRUD modules in FourSPM Web follow a layered architecture consisting of:

1. **UI Component Layer**: The main React component handling the collection view (e.g., `deliverables.tsx`)
2. **Column Configuration Layer**: Separate configuration for grid columns (e.g., `deliverable-columns.ts`)
3. **Controller Hook Layer**: Specialized hooks for data manipulation, validation, and business logic (e.g., `useDeliverableController.ts`)
4. **Adapter Layer**: Entity-specific adapters for data transformation and complex operations (e.g., `deliverable.adapter.ts`)
5. **Service Layer**: API services for data fetching and persistence

This architecture aligns with the 5-layer approach described in the [API Services Documentation](./api-services-documentation.md).

## Step-by-Step Guide

### 1. Create the Main Component File

Start by creating your main component file (e.g., `entity-collection.tsx`) with the following structure:

```tsx
import React from 'react';
import { useParams } from 'react-router-dom';
import { API_CONFIG } from '../../config/api';
import { ODataGrid } from '../../components/ODataGrid/ODataGrid';
import { createEntityColumns } from './entity-columns';
import { useAuth } from '../../contexts/auth';
import ScrollToTop from '../../components/scroll-to-top';
import { useEntityController } from '../../hooks/controllers/useEntityController';
import './entity-collection.scss';

interface EntityParams {
  parentId: string;
}

const EntityCollection: React.FC = () => {
  // Component logic here
};

export default EntityCollection;
```

### 2. Create or Update the Entity Adapter

Create a file in the `src/adapters` directory named `entity-name.adapter.ts` that handles entity-specific operations and data transformation:

```typescript
// src/adapters/entity-name.adapter.ts
import { Entity, UpdateEntityData } from '../types';
import { sharedApiService } from '../api/shared-api.service';

/**
 * Processes a row update for a specific entity
 * @param entityGuid The entity GUID
 * @param newData The updated entity data
 * @param token User authentication token
 */
export const handleEntityUpdate = async (
  entityGuid: string,
  newData: Partial<Entity>,
  token: string
): Promise<void> => {
  try {
    // Prepare data for API (removing nested objects, etc.)
    const updateData: UpdateEntityData = {
      name: newData.name,
      description: newData.description,
      // Add other fields as needed
    };
    
    // Update the entity in the backend
    await sharedApiService.update(
      '/odata/v1/Entities',
      entityGuid,
      updateData,
      token
    );
  } catch (error) {
    console.error('Error updating entity:', error);
    throw error;
  }
};

/**
 * Processes entity deletion
 * @param entityGuid The entity GUID to delete
 * @param token User authentication token
 */
export const handleEntityDelete = async (
  entityGuid: string,
  token: string
): Promise<void> => {
  try {
    await sharedApiService.delete('/odata/v1/Entities', entityGuid, token);
  } catch (error) {
    console.error('Error deleting entity:', error);
    throw error;
  }
};

/**
 * Handles entity insertion with validation
 * @param entityData The new entity data
 * @param projectGuid Optional project GUID for associated entities
 * @param token User authentication token
 */
export const handleEntityInsert = async (
  entityData: Partial<Entity>,
  projectGuid: string | undefined,
  token: string
): Promise<void> => {
  try {
    // Add any required fields
    const insertData = {
      ...entityData,
      projectGuid: projectGuid,
      // Any other default values or transformations
    };
    
    await sharedApiService.create('/odata/v1/Entities', insertData, token);
  } catch (error) {
    console.error('Error creating entity:', error);
    throw error;
  }
};
```

### 3. Create the Column Configuration

Create a separate file (e.g., `entity-columns.ts`) to define grid columns:

```typescript
import { ODataGridColumn } from '../../components/ODataGrid/odata-grid-column';

/**
 * Creates column configurations for the entity collection grid
 * @param parentId The ID of the parent entity to filter related data
 * @returns Array of column configurations
 */
export const createEntityColumns = (parentId: string): ODataGridColumn[] => [
  {
    dataField: 'name',
    caption: 'Name',
    dataType: 'string',
    validationRules: [{ type: 'required' }]
  },
  {
    dataField: 'description',
    caption: 'Description',
    dataType: 'string'
  },
  {
    dataField: 'typeId',
    caption: 'Type',
    dataType: 'number',
    lookup: {
      dataSource: [
        { id: 0, name: 'Type 1' },
        { id: 1, name: 'Type 2' },
        { id: 2, name: 'Type 3' }
      ],
      valueExpr: 'id',
      displayExpr: 'name'
    }
  },
  {
    dataField: 'relatedItemId',
    caption: 'Related Item',
    dataType: 'string',
    lookup: {
      dataSource: {
        store: {
          type: 'odata',
          url: `${API_CONFIG.baseUrl}/odata/v1/RelatedItems`,
          key: 'guid',
          beforeSend: (option) => {
            option.headers = {
              'Authorization': `Bearer ${localStorage.getItem('token')}` 
            };
          }
        },
        paginate: true,
        filter: ['someField', '=', someValue]
      },
      valueExpr: 'guid',
      displayExpr: 'name'
    }
  },
  {
    dataField: 'status',
    caption: 'Status',
    dataType: 'string',
    calculateCellValue: (data) => {
      return data.completed ? 'Complete' : 'In Progress';
    },
    allowEditing: false
  }
];
```

### 4. Implement Controller Hook

Create a controller hook that manages all grid operations and integrates with the entity adapter (e.g., `useEntityController.ts`):

```typescript
// src/hooks/controllers/useEntityController.ts
import { useState, useEffect, useCallback } from 'react';
import { GridOperationsConfig, ValidationRule } from '../interfaces/collection-hook.interfaces';
import { createCollectionHook } from '../factories/createCollectionHook';
import { sharedApiService } from '../../api/shared-api.service';
import { handleEntityUpdate, handleEntityDelete, handleEntityInsert } from '../../adapters/entity-name.adapter';
import { Entity } from '../../types';

// Default validation rules
const DEFAULT_VALIDATION_RULES: ValidationRule[] = [
  { field: 'name', required: true, errorText: 'Name is required' }
];

export const useEntityController = (
  userToken: string | undefined,
  parentId: string | undefined,
  gridConfig: Partial<GridOperationsConfig> = {},
  validationRules: ValidationRule[] = DEFAULT_VALIDATION_RULES
) => {
  const [parent, setParent] = useState<any>(null);

  // Fetch parent entity for context if needed
  useEffect(() => {
    if (userToken && parentId) {
      // Load parent entity data
      sharedApiService.getById('/odata/v1/Parents', parentId, userToken)
        .then(data => setParent(data))
        .catch(error => console.error('Error loading parent:', error));
    }
  }, [userToken, parentId]);
  
  // Create collection hook for basic operations
  const collectionHook = createCollectionHook<Entity>({
    services: {
      getAll: async (_options, token) => {
        if (!token || !parentId) throw new Error('Token and parent ID are required');
        
        const entities = await sharedApiService.getAll<Entity>(
          '/odata/v1/Entities',
          token,
          `$filter=parentGuid eq ${parentId}`
        );
        
        return entities;
      }
      // We don't use the standard update/delete/create methods since
      // we're using the adapter functions instead
    },
    callbacks: {
      onError: (error, operation) => console.error(`Error in Entity operation (${operation}):`, error),
      ...gridConfig
    },
    validationRules
  }, userToken);

  /**
   * Custom row updating handler that uses the entity adapter
   */
  const customHandleRowUpdating = async (e: any) => {
    // Run validation from collectionHook
    if (collectionHook.handleRowUpdating) {
      collectionHook.handleRowUpdating(e);
    }
    
    // Cancel the standard update since we're handling it manually
    e.cancel = true;
    
    try {
      if (!userToken) throw new Error('Authentication token required');
      
      // Use the adapter to handle the update with specialized logic
      await handleEntityUpdate(e.key, e.newData, userToken);
      
      // Refresh grid data
      if (e.component) {
        setTimeout(() => {
          if (e.component.hasEditData()) {
            e.component.cancelEditData();
          }
          e.component.getDataSource().reload();
        }, 50);
      }
    } catch (error) {
      console.error('Error updating entity:', error);
      if (gridConfig.onUpdateError) {
        gridConfig.onUpdateError(error);
      }
    }
  };
  
  /**
   * Custom row removing handler that uses the entity adapter
   */
  const customHandleRowRemoving = async (e: any) => {
    // Run validation from collectionHook
    if (collectionHook.handleRowRemoving) {
      collectionHook.handleRowRemoving(e);
    }
    
    // Cancel the standard delete since we're handling it manually
    e.cancel = true;
    
    try {
      if (!userToken) throw new Error('Authentication token required');
      
      // Use the adapter to handle the delete with specialized logic
      await handleEntityDelete(e.key, userToken);
      
      // Refresh grid data
      if (e.component) {
        setTimeout(() => {
          e.component.getDataSource().reload();
        }, 50);
      }
    } catch (error) {
      console.error('Error deleting entity:', error);
      if (gridConfig.onDeleteError) {
        gridConfig.onDeleteError(error);
      }
    }
  };
  
  /**
   * Custom row inserting handler that uses the entity adapter
   */
  const customHandleRowInserting = async (e: any) => {
    // Run validation from collectionHook
    if (collectionHook.handleRowInserting) {
      collectionHook.handleRowInserting(e);
    }
    
    // Cancel the standard insert since we're handling it manually
    e.cancel = true;
    
    try {
      if (!userToken) throw new Error('Authentication token required');
      
      // Use the adapter to handle the insert with specialized logic
      await handleEntityInsert(e.data, parentId, userToken);
      
      // Refresh grid data
      if (e.component) {
        setTimeout(() => {
          if (e.component.hasEditData()) {
            e.component.cancelEditData();
          }
          e.component.getDataSource().reload();
        }, 50);
      }
    } catch (error) {
      console.error('Error inserting entity:', error);
      if (gridConfig.onInsertError) {
        gridConfig.onInsertError(error);
      }
    }
  };

  return {
    ...collectionHook,
    handleRowUpdating: customHandleRowUpdating,
    handleRowRemoving: customHandleRowRemoving,
    handleRowInserting: customHandleRowInserting,
    parent
  };
};
```

### 5. Set Up Component with Controller Hook

Implement the component using the controller hook to handle all CRUD operations:

```tsx
// Extract parameters from URL
const { parentId } = useParams<EntityParams>();
const { user } = useAuth();
const endpoint = `${API_CONFIG.baseUrl}/odata/v1/Entities`;

// Use the controller hook for all grid operations
const {
  handleRowUpdating,
  handleRowRemoving,
  handleRowInserting,
  onRowValidating,
  handleInitNewRow,
  handleEditorPreparing,
  handleGridInitialized,
  parent // Optionally get parent data for context
} = useEntityController(
  user?.token,
  parentId,
  {
    onDeleteError: (error) => console.error('Failed to delete entity:', error),
    onUpdateError: (error) => console.error('Failed to update entity:', error)
  }
);

// Create columns configuration
const columns = createEntityColumns(parentId);
```

### 6. Render the Grid Component

```tsx
// Render the grid component with the columns and controller hook handlers
<ODataGrid
  columns={columns}
  onRowUpdating={handleRowUpdating}
  onRowRemoving={handleRowRemoving}
  onRowInserting={handleRowInserting}
  onRowValidating={onRowValidating}
  onInitNewRow={handleInitNewRow}
  onEditorPreparing={handleEditorPreparing}
  onGridInitialized={handleGridInitialized}
  defaultFilter={[['parentGuid', '=', parentId]]}
/>
```

## Common Implementation Patterns

### Filtering by Parent Entity

In most collection views, entities should be filtered by a parent entity ID:

```tsx
// In the ODataGrid component
defaultFilter={[['parentGuid', '=', parentId]]}
```

### Related Entity Lookups

For fields that reference other entities, use OData lookups:

```typescript
{
  dataField: 'relatedEntityId',
  caption: 'Related Entity',
  lookup: {
    dataSource: {
      store: {
        type: 'odata',
        url: `${API_CONFIG.baseUrl}/odata/v1/RelatedEntities`,
        key: 'guid',
        beforeSend: (option) => {
          option.headers = {
            'Authorization': `Bearer ${localStorage.getItem('token')}` 
          };
        }
      },
      paginate: true,
      filter: ['someField', '=', someValue]
    },
    valueExpr: 'guid',
    displayExpr: 'name'
  }
}
```

### Custom Validation

Implement custom validation in the controller hook:

```typescript
const onRowValidating = useCallback((e: any) => {
  // Custom validation logic
  const { brokenRules } = e;
  
  // Example validation rule
  if (e.newData.someField && !isValid(e.newData.someField)) {
    brokenRules.push({
      type: 'custom',
      message: 'Invalid value',
      columnIndex: e.columns.findIndex(c => c.dataField === 'someField')
    });
  }
}, []);
```

### Calculated Fields

Use `calculateCellValue` for computed properties:

```typescript
{
  dataField: 'fullName',
  caption: 'Full Name',
  calculateCellValue: (data) => {
    return `${data.firstName} ${data.lastName}`;
  },
  allowEditing: false
}
```

## Troubleshooting

### Common Issues and Solutions

1. **OData Filtering Issues**: Ensure filter syntax is correct and fields exist in the backend model
2. **Grid Not Refreshing After Updates**: Verify that the backend successfully processes updates and returns proper status codes
3. **Validation Errors**: Handle validation error display correctly in the grid
4. **Authentication**: Verify that authentication tokens are properly passed to services
5. **Controller Hook Dependency Arrays**: Check that useCallback and useEffect dependencies are correctly specified

## Conclusion

By following this guide and using the controller hook pattern, you can create consistent and maintainable collection CRUD modules. This approach centralizes business logic in specialized hooks while keeping the UI components clean and focused on presentation concerns.
