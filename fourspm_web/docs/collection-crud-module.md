# Collection CRUD Module Documentation

## Overview

This document provides a guide for creating collection CRUD (Create, Read, Update, Delete) modules in the FourSPM Web application. Collection views display multiple entity instances in a grid format, allowing users to view, edit, add, and delete records.

For information about the underlying API service architecture, please refer to the [API Services Documentation](./api-services-documentation.md).

## Architecture

Collection CRUD modules in FourSPM Web follow a layered architecture consisting of:

1. **UI Component Layer**: The main React component handling the collection view
2. **Column Configuration Layer**: Separate configuration for grid columns
3. **Custom Hooks Layer**: Specialized hooks for data manipulation and validation
4. **Service Layer**: API services for data fetching and persistence

This architecture aligns with the 5-layer approach described in the [API Services Documentation](./api-services-documentation.md):

1. **Base Layer**: `odata.service.ts` and `base-api.service.ts`
2. **Shared Service Layer**: `shared-api.service.ts`
3. **Domain Service Layer**: Individual service files
4. **Hook Layer**: React hooks for component state management
5. **Component Layer**: Components like `ODataGrid`

## Step-by-Step Guide

### 1. Create the Main Component File

Start by creating your main component file (e.g., `collection-view.tsx`) with the following structure:

```tsx
import React, { useState, useEffect } from 'react';
import './collection-view.scss'; // Create matching SCSS file
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/auth';
import { LoadPanel } from 'devextreme-react/load-panel';
import { ODataGrid } from '../../components/data-grid/odata-grid';
import { API_CONFIG } from '../../config';

// Import custom hooks and column configurations
import { useDataHandlers } from '../../hooks/useDataHandlers';
import { createEntityColumns } from './entity-columns';

// Define URL parameters interface
interface CollectionViewParams {
  parentId: string;
}

const CollectionView: React.FC = () => {
  // Component logic here
};

export default CollectionView;
```

### 2. Set Up Component State and Hooks

Initialize component state and integrate custom hooks for data fetching:

```tsx
// Extract parameters from URL
const { parentId } = useParams<CollectionViewParams>();
const { user } = useAuth();

// Component state
const [isLoading, setIsLoading] = useState(true);
const [parentData, setParentData] = useState<any>(null);

// Use custom hooks for data fetching
const { relatedData, isLoadingRelatedData } = useRelatedDataHook(parentId, user?.token);
```

### 3. Set Up Data Manipulation Handlers

Implement handlers for grid operations using custom hooks:

```tsx
// Set up handlers for CRUD operations
const { 
  handleRowUpdating, 
  handleRowValidating,
  handleRowInserting,
  handleRowRemoving
} = useDataHandlers(parentId, user?.token);
```

### 4. Implement Loading State

Combine loading states and create a loading panel:

```tsx
// Combine loading states
const isLoading = isLoadingRelatedData || !parentData;

// Loading state JSX
if (isLoading) {
  return (
    <div className="collection-container">
      <div className="loading-container">
        <LoadPanel 
          visible={true} 
          showIndicator={true}
          showPane={true}
        />
      </div>
    </div>
  );
}
```

### 5. Render the Grid Component

Implement the main grid component with the ODataGrid:

```tsx
return (
  <div className="collection-container">
    <div className="custom-grid-wrapper">
      <div className="grid-header-container">
        <div className="grid-custom-title">
          {parentData ? `${parentData.name} Items` : 'Collection View'}
        </div>
        
        {/* Optional metadata display */}
        <div className="metadata-section">
          <span>Parent ID: </span>
          <strong>{parentId}</strong>
        </div>
      </div>
      
      <ODataGrid
        title="Collection Title"
        endpoint={`${API_CONFIG.baseUrl}/odata/v1/Entities?$filter=parentId eq ${parentId}`}
        columns={createEntityColumns()}
        keyField="guid"
        onRowUpdating={handleRowUpdating}
        onRowValidating={handleRowValidating}
        onRowInserting={handleRowInserting}
        onRowRemoving={handleRowRemoving}
        allowUpdating={true}
        allowAdding={true}
        allowDeleting={true}
      />
    </div>
  </div>
);
```

### 6. Create Column Configuration

Create a separate file (e.g., `entity-columns.ts`) to define grid columns:

```typescript
import { Column } from 'devextreme/ui/data_grid';
import { formatDate } from '../../utils/formatters';

/**
 * Creates column configurations for the entity collection grid
 * @returns Array of column configurations
 */
export const createEntityColumns = (): Partial<Column>[] => [
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
    dataField: 'type',
    caption: 'Type',
    dataType: 'string',
    lookup: {
      dataSource: [
        { id: 'type1', name: 'Type 1' },
        { id: 'type2', name: 'Type 2' }
      ],
      valueExpr: 'id',
      displayExpr: 'name'
    }
  },
  {
    dataField: 'dateCreated',
    caption: 'Created Date',
    dataType: 'date',
    format: 'MM/dd/yyyy',
    calculateCellValue: (data: any) => formatDate(data.dateCreated),
    allowEditing: false
  }
];
```

### 7. Create Data Handlers Hook

Implement a custom hook to handle data operations (e.g., `useDataHandlers.ts`):

```typescript
import { useState, useCallback } from 'react';
import { entityService } from '../services/entity.service';
import notify from 'devextreme/ui/notify';

/**
 * Hook to manage entity data operations
 * @param parentId Parent entity ID
 * @param userToken Authentication token
 * @returns Object containing handler functions
 */
export const useDataHandlers = (parentId: string | undefined, userToken: string | undefined) => {
  /**
   * Handle row updating event
   * @param e Row updating event object
   * @returns Promise resolving to operation success
   */
  const handleRowUpdating = useCallback(async (e: any) => {
    if (!userToken || !parentId) return false;

    try {
      const entityId = e.key;
      const updatedData = { ...e.newData };
      
      await entityService.updateEntity(entityId, updatedData, userToken);
      notify('Record updated successfully', 'success', 3000);
      return true;
    } catch (error) {
      console.error('Error updating row:', error);
      notify('Error updating record', 'error', 3000);
      return false;
    }
  }, [parentId, userToken]);

  /**
   * Handle row validating event
   * @param e Row validating event object
   */
  const handleRowValidating = useCallback((e: any) => {
    // Implement custom validation logic
    const { brokenRules } = e;
    
    // Example: Custom validation for specific fields
    if (e.newData.name && e.newData.name.length < 3) {
      brokenRules.push({
        type: 'custom',
        message: 'Name must be at least 3 characters long'
      });
    }
  }, []);

  /**
   * Handle row inserting event
   * @param e Row inserting event object
   * @returns Promise resolving to operation success
   */
  const handleRowInserting = useCallback(async (e: any) => {
    if (!userToken || !parentId) return false;

    try {
      const newData = { 
        ...e.data,
        parentId // Link to parent entity
      };
      
      await entityService.createEntity(newData, userToken);
      notify('Record created successfully', 'success', 3000);
      return true;
    } catch (error) {
      console.error('Error creating row:', error);
      notify('Error creating record', 'error', 3000);
      return false;
    }
  }, [parentId, userToken]);

  /**
   * Handle row removing event
   * @param e Row removing event object
   * @returns Promise resolving to operation success
   */
  const handleRowRemoving = useCallback(async (e: any) => {
    if (!userToken) return false;

    try {
      const entityId = e.key;
      
      await entityService.deleteEntity(entityId, userToken);
      notify('Record deleted successfully', 'success', 3000);
      return true;
    } catch (error) {
      console.error('Error deleting row:', error);
      notify('Error deleting record', 'error', 3000);
      return false;
    }
  }, [userToken]);

  return {
    handleRowUpdating,
    handleRowValidating,
    handleRowInserting,
    handleRowRemoving
  };
};
```

### 8. Create Entity Service

Implement API service functions for your entity collection (e.g., `entity.service.ts`):

```typescript
import { sharedApiService } from './shared-api.service';

/**
 * Updates an entity with new data
 * @param entityId Entity GUID
 * @param entityData Updated entity data
 * @param token Authentication token
 * @returns Promise resolving to updated entity data
 */
const updateEntity = async (
  entityId: string,
  entityData: any,
  token: string
): Promise<any> => {
  try {
    return await sharedApiService.update<any>(
      '/odata/v1/Entities',
      entityId,
      entityData,
      token
    );
  } catch (error) {
    console.error('Error updating entity:', error);
    throw error;
  }
};

/**
 * Creates a new entity
 * @param entityData Entity data to create
 * @param token Authentication token
 * @returns Promise resolving to created entity data
 */
const createEntity = async (
  entityData: any,
  token: string
): Promise<any> => {
  try {
    return await sharedApiService.post<any>(
      '/odata/v1/Entities',
      entityData,
      token
    );
  } catch (error) {
    console.error('Error creating entity:', error);
    throw error;
  }
};

/**
 * Deletes an entity
 * @param entityId Entity GUID to delete
 * @param token Authentication token
 * @returns Promise resolving to deletion success
 */
const deleteEntity = async (
  entityId: string,
  token: string
): Promise<boolean> => {
  try {
    await sharedApiService.delete<any>(
      '/odata/v1/Entities',
      entityId,
      token
    );
    return true;
  } catch (error) {
    console.error('Error deleting entity:', error);
    throw error;
  }
};

export const entityService = {
  updateEntity,
  createEntity,
  deleteEntity
};
```

## CSS Structure

Create a matching SCSS file (e.g., `collection-view.scss`) with these core styles:

```scss
.collection-container {
  height: 100%;
  position: relative;
  
  .loading-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
  }
  
  .custom-grid-wrapper {
    height: 100%;
    display: flex;
    flex-direction: column;
    
    .grid-header-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 16px;
      
      .grid-custom-title {
        font-size: 18px;
        font-weight: 500;
      }
      
      .metadata-section {
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }
  }
}
```

## Advanced Patterns

### Filtering and Sorting

Implement grid filtering and sorting:

```tsx
<ODataGrid
  // ... other props
  allowFiltering={true}
  allowSorting={true}
  defaultFilterValue={[
    ['status', '=', 'active']
  ]}
  defaultSortOrder={[{
    selector: 'dateCreated',
    desc: true
  }]}
/>
```

### Edit Modes

The ODataGrid component in FourSPM Web uses cell editing mode by default, which provides immediate updates when a cell is edited. This is the recommended approach for most use cases as it provides the best user experience.

#### Cell Editing

Cell editing is enabled by default and requires no special configuration:

```tsx
<ODataGrid
  // ... other props
  onRowUpdating={handleRowUpdating}
  allowUpdating={true}
/>
```

For function endpoints that don't support standard PATCH operations, implement a custom row updating handler:

```tsx
// Handle row updating event for cell editing with custom endpoint
const handleRowUpdating = (e: any) => {
  // Cancel default behavior for custom endpoints
  e.cancel = true;
  
  // Create an update function that processes updates as needed
  const update = async () => {
    try {
      // Process the update using custom service
      await processRowUpdate(e);
      
      // Exit edit mode and refresh grid
      if (e.component) {
        setTimeout(() => {
          if (e.component.hasEditData()) {
            e.component.cancelEditData();
          }
          e.component.getDataSource().reload();
        }, 50);
      }
    } catch (error) {
      console.error('Error updating row:', error);
      if (e.component) {
        e.component.refresh();
      }
    }
  };
  
  // Start the update process
  update();
};
```

#### Batch Editing

Enable batch editing mode for more efficient updates of multiple cells:

```tsx
// Switch ODataGrid to batch mode
<ODataGrid
  // ... other props
  onSaving={handleSaving}
  allowUpdating={true}
/>
```

For batch editing, implement a saving handler:

```tsx
const handleSaving = (e: any) => {
  // Process all changes at once when Save button is clicked
  const { changes } = e;
  if (changes.length > 0) {
    // Process all changes
    // ...
  }
};
```

### Master-Detail Views

Implement master-detail relationships in your grid:

```tsx
<ODataGrid
  // ... other props
  masterDetail={{
    enabled: true,
    template: (container, options) => {
      return renderDetailContent(container, options.data);
    }
  }}
/>
```

## Common Patterns and Best Practices

1. **Consistent Endpoint Structure**: Use consistent OData endpoint patterns with appropriate query parameters
2. **Column Configuration**: Keep column definitions in a separate file for maintainability
3. **Custom Data Handlers**: Create reusable hooks for data manipulation operations
4. **Centralized Validation**: Implement both client-side and server-side validation
5. **Error Handling**: Provide clear error messages and handling for all operations
6. **Loading States**: Always show loading indicators during asynchronous operations
7. **Responsive Design**: Ensure the grid works well on different screen sizes

## Troubleshooting

### Common Issues

1. **OData Query Syntax**: Ensure proper OData query syntax for filtering and expanding related entities
2. **Data Refresh**: Implement proper refresh mechanics after CRUD operations
3. **Validation Errors**: Handle validation error display correctly in the grid
4. **Authentication**: Verify that authentication tokens are properly passed to services

## Conclusion

This guide provides a foundation for creating collection CRUD modules in the FourSPM Web application. By following these patterns and practices, you can create consistent, maintainable, and user-friendly interfaces for managing collections of entity data.

For more information about the underlying API service architecture, please refer to the [API Services Documentation](./api-services-documentation.md).
