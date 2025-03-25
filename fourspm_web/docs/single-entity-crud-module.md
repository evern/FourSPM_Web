# Single Entity CRUD Module Documentation

## Overview

This document provides a guide for creating single entity CRUD (Create, Read, Update, Delete) modules in the FourSPM Web application, using the [Project Profile](../src/pages/project/project-profile.tsx) component as an example. These modules allow users to view and edit details of a single entity instance, as opposed to collection views that display multiple instances.

For information about the underlying API service architecture, please refer to the [API Services Documentation](./api-services-documentation.md).

## Architecture

Single entity CRUD modules in FourSPM Web follow a layered architecture consisting of:

1. **UI Component Layer**: The main React component (e.g., `ProjectProfile.tsx`)
2. **Form Configuration Layer**: Separate configuration for form items (e.g., `project-form-items.ts`)
3. **Controller Hook Layer**: Specialized hooks for state management and business logic (e.g., `useProjectEntityController.ts`)
4. **Adapter Layer**: Entity-specific adapters for data transformation and complex operations (e.g., `project.adapter.ts`)
5. **Service Layer**: API services for data fetching and persistence (e.g., `shared-api.service.ts`)

This architecture promotes separation of concerns, reusability, and maintainability.

## Step-by-Step Guide

### 1. Create the Main Component File

Start by creating your main component file (e.g., `entity-profile.tsx`) with the following structure:

```tsx
import React, { useState } from 'react';
import './entity-profile.scss'; // Create matching SCSS file
import Form from 'devextreme-react/form';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/auth';
import { Button } from 'devextreme-react/button';
import { ScrollView } from 'devextreme-react/scroll-view';
import { LoadPanel } from 'devextreme-react/load-panel';
import ScrollToTop from '../../components/scroll-to-top';

// Import controller hook
import { useEntityController } from '../../hooks/controllers/useEntityController';

// Import form items configuration
import { createEntityFormItems } from './entity-form-items';

// Define URL parameters interface
interface EntityProfileParams {
  entityId: string;
}

const EntityProfile: React.FC = () => {
  // Component logic here
};

export default EntityProfile;
```

### 2. Create or Update the Entity Adapter

Create a file in the `src/adapters` directory named `entity-name.adapter.ts` with functions for fetching, updating, and transforming entity data:

```typescript
// src/adapters/entity-name.adapter.ts
import { EntityType } from '../types';
import { sharedApiService } from '../api/shared-api.service';

/**
 * Fetch entity information from the API
 * @param entityId The entity GUID to fetch information for
 * @param userToken The user's authentication token
 * @returns A promise resolving to the entity information
 */
export const fetchEntity = async (entityId: string, userToken: string): Promise<EntityType> => {
  try {
    const data = await sharedApiService.getById<any>('/odata/v1/Entities', entityId, userToken, '$expand=RelatedEntity');
    
    // Transform API data to frontend model
    return {
      guid: data.guid,
      name: data.name || '',
      // Map other properties as needed
    };
  } catch (error) {
    console.error('fetchEntity: Error in getById call', error);
    throw error;
  }
};

/**
 * Updates entity information
 * @param entityId Entity GUID
 * @param data Partial entity data to update
 * @param token User authentication token
 * @returns Updated entity details
 */
export const updateEntity = async (
  entityId: string, 
  data: Partial<EntityType>, 
  token: string
): Promise<EntityType> => {
  try {
    // Clean data for API
    const apiData = {
      ...data,
      // Remove nested objects if needed
      relatedEntity: undefined
    };
    
    // Perform update
    await sharedApiService.update<Partial<EntityType>>(
      '/odata/v1/Entities',
      entityId,
      apiData,
      token
    );
    
    // Fetch updated entity details
    return fetchEntity(entityId, token);
  } catch (error) {
    console.error('Error updating entity:', error);
    throw error;
  }
};
```

### 3. Create the Entity Controller Hook

Implement the component using a specialized controller hook for handling entity operations:

```tsx
// Extract parameters from URL
const { entityId } = useParams<EntityProfileParams>();
const { user } = useAuth();

// Use the entity controller hook
const {
  entity,
  isLoading,
  isEditing,
  isSaving,
  formRef,
  startEdit,
  cancelEdit,
  saveEntityChanges,
  onFormRef
} = useEntityController(entityId, user?.token);

// Create form items based on entity data and edit mode
const formItems = createEntityFormItems(entity, isEditing);
```

### 4. Implement Component Rendering

Implement the rendering logic with loading state, form, and action buttons:

```tsx
// Loading state
if (isLoading || !entity) {
  return (
    <div className="profile-container">
      <div className="custom-grid-wrapper">
        <div className="grid-custom-title">Loading Entity Details...</div>
      </div>
      <LoadPanel 
        visible={true} 
        position={{ of: '.profile-container' }}
        showIndicator={true}
        showPane={true}
      />
    </div>
  );
}

return (
  <div className="profile-container">
    <LoadPanel 
      visible={isSaving} 
      position={{ of: '.profile-container' }}
      showIndicator={true}
      showPane={true}
    />
    
    <div className="custom-grid-wrapper">
      <div className="grid-header-container">
        <div className="grid-custom-title">
          {entity ? `Entity: ${entity.name}` : 'Entity Details'}
        </div>
        
        <div className="action-buttons">
          {!isEditing ? (
            <Button
              text="Edit"
              type="default"
              stylingMode="contained"
              onClick={startEdit}
            />
          ) : (
            <div className="edit-buttons-container">
              <Button
                text="Save"
                type="success"
                stylingMode="contained"
                onClick={saveEntityChanges}
                disabled={isSaving}
              />
              <Button
                text="Cancel"
                type="normal"
                stylingMode="contained"
                onClick={cancelEdit}
                disabled={isSaving}
              />
            </div>
          )}
        </div>
      </div>

      <ScrollView
        className="scrollable-content"
        height={"calc(100vh - 200px)"}
        width={"100%"}
      >
        <div className="form-container">
          <Form
            ref={onFormRef}
            formData={entity}
            items={formItems}
            labelLocation="top"
            minColWidth={233}
            colCount="auto"
            readOnly={!isEditing}
          />
        </div>
      </ScrollView>
    </div>
    <ScrollToTop />
  </div>
);
```

### 5. Create Form Items Configuration

Create a separate file for form configuration (e.g., `entity-form-items.ts`):

```typescript
import { Item } from 'devextreme/ui/form';

/**
 * Creates form items configuration for entity profile
 * @param entity The entity data to display/edit
 * @param isEditing Whether the form is in edit mode
 * @returns Array of form item configurations
 */
export const createEntityFormItems = (entity: any, isEditing: boolean): Item[] => {
  if (!entity) return [];
  
  return [
    {
      itemType: 'group',
      caption: 'General Information',
      items: [
        {
          dataField: 'name',
          label: { text: 'Name' },
          editorOptions: {
            disabled: !isEditing
          },
          validationRules: [
            { type: 'required', message: 'Name is required' }
          ]
        },
        {
          dataField: 'description',
          label: { text: 'Description' },
          editorType: 'dxTextArea',
          editorOptions: {
            height: 90,
            disabled: !isEditing
          }
        },
        {
          dataField: 'typeId',
          label: { text: 'Type' },
          editorType: 'dxSelectBox',
          editorOptions: {
            items: [
              { id: 0, name: 'Type 1' },
              { id: 1, name: 'Type 2' },
              { id: 2, name: 'Type 3' }
            ],
            valueExpr: 'id',
            displayExpr: 'name',
            disabled: !isEditing
          }
        }
      ]
    },
    {
      itemType: 'group',
      caption: 'Additional Details',
      items: [
        {
          dataField: 'status',
          label: { text: 'Status' },
          editorType: 'dxTextBox',
          editorOptions: {
            readOnly: true  // Always read-only
          }
        },
        {
          dataField: 'createdDate',
          label: { text: 'Created Date' },
          editorType: 'dxDateBox',
          editorOptions: {
            displayFormat: 'MM/dd/yyyy',
            readOnly: true  // Always read-only
          }
        }
      ]
    }
  ];
};
```

### 6. Implement Entity Controller Hook

Create a controller hook that manages all entity operations (e.g., `useEntityController.ts`):

```typescript
import { useState, useEffect, useCallback, useRef } from 'react';
import Form from 'devextreme-react/form';
import { sharedApiService } from '../../services/api/shared-api.service';
import notify from 'devextreme/ui/notify';

/**
 * Hook for managing entity CRUD operations
 * @param entityId ID of the entity to manage
 * @param token Authentication token
 * @returns Object containing entity state and handlers
 */
export const useEntityController = (
  entityId: string | undefined,
  token: string | undefined
) => {
  // State management
  const [entity, setEntity] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [formRef, setFormRef] = useState<Form | null>(null);
  
  // Form reference handler
  const onFormRef = useCallback((ref: Form) => {
    if (ref) {
      setFormRef(ref);
    }
  }, []);
  
  // Fetch entity data on component mount
  useEffect(() => {
    const fetchEntityData = async () => {
      if (!token || !entityId) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        const data = await sharedApiService.getById('/odata/v1/Entities', entityId, token);
        setEntity(data);
      } catch (error) {
        console.error('Error fetching entity data:', error);
        notify('Error loading entity data', 'error', 3000);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEntityData();
  }, [entityId, token]);
  
  // Enter edit mode
  const startEdit = useCallback(() => {
    setIsEditing(true);
  }, []);
  
  // Cancel edit mode
  const cancelEdit = useCallback(() => {
    setIsEditing(false);
    
    // Reset form data to original entity data
    if (formRef && entity) {
      formRef.instance.updateData(entity);
    }
  }, [entity, formRef]);
  
  // Save entity changes
  const saveEntityChanges = useCallback(async () => {
    if (!token || !entityId || !formRef) {
      return;
    }
    
    // Validate form before saving
    const validationResult = formRef.instance.validate();
    if (!validationResult.isValid) {
      return;
    }
    
    // Get updated data from form
    const updatedData = { ...formRef.instance.option('formData') };
    
    setIsSaving(true);
    try {
      // Update entity via service
      const result = await sharedApiService.update(
        `/odata/v1/Entities(${entityId})`,
        token,
        updatedData
      );
      
      // Update local state with result
      setEntity(result);
      setIsEditing(false);
      notify('Entity updated successfully', 'success', 3000);
      
      return result;
    } catch (error) {
      console.error('Error updating entity:', error);
      notify('Error updating entity', 'error', 3000);
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [entityId, token, formRef]);
  
  return {
    entity,
    isLoading,
    isEditing,
    isSaving,
    formRef,
    startEdit,
    cancelEdit,
    saveEntityChanges,
    onFormRef
  };
};
```

### 7. Create SCSS Styling

Implement styling for the profile component:

```scss
.profile-container {
  height: 100%;
  width: 100%;
  padding: 20px;
  position: relative;
  
  .custom-grid-wrapper {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: var(--dx-background-color);
    border-radius: 8px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    
    .grid-header-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid var(--dx-border-color);
      
      .grid-custom-title {
        font-size: 1.2rem;
        font-weight: 600;
      }
      
      .action-buttons {
        display: flex;
        
        .edit-buttons-container {
          display: flex;
          gap: 8px;
        }
      }
    }
    
    .scrollable-content {
      flex: 1;
      
      .form-container {
        padding: 20px;
      }
    }
  }
}
```

## Common Implementation Patterns

### Related Entity Lookups

When a form field requires selection from a related entity, implement a lookup:

```typescript
{
  dataField: 'relatedEntityId',
  label: { text: 'Related Entity' },
  editorType: 'dxSelectBox',
  editorOptions: {
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
      paginate: true
    },
    valueExpr: 'guid',
    displayExpr: 'name',
    searchEnabled: true,
    disabled: !isEditing
  }
}
```

### Conditional Form Items

Implement conditional form items based on entity state or user role:

```typescript
const formItems = [
  // Standard form items...
];

// Add conditional items
if (entity.status === 'Active' && userHasPermission) {
  formItems.push({
    itemType: 'group',
    caption: 'Advanced Settings',
    items: [
      // Advanced form items...
    ]
  });
}

return formItems;
```

### Custom Validation Rules

Implement custom validation rules for form fields:

```typescript
{
  dataField: 'customField',
  label: { text: 'Custom Field' },
  validationRules: [
    { 
      type: 'custom',
      validationCallback: (e: any) => {
        // Custom validation logic
        return isValid(e.value);
      },
      message: 'Invalid value'
    }
  ]
}
```

### Form Group Layout

Organize form fields into logical groups for better user experience:

```typescript
[
  {
    itemType: 'group',
    caption: 'General Information',
    colCount: 2,
    items: [
      // General info fields...
    ]
  },
  {
    itemType: 'group',
    caption: 'Contact Information',
    colCount: 2,
    items: [
      // Contact fields...
    ]
  }
]
```

## Troubleshooting

### Common Issues and Solutions

1. **Form Validation**: Ensure validation rules are correctly defined and triggered
2. **Data Synchronization**: Keep form data synchronized with entity state, especially after canceling edits
3. **API Integration**: Handle API errors gracefully and show appropriate notifications
4. **Performance**: Use memoization for callbacks and avoid unnecessary rerenders
5. **Form References**: Ensure form references are properly managed with useCallback

## Conclusion

By following this guide and using the controller hook pattern, you can create consistent and maintainable single entity CRUD modules. This approach centralizes business logic in specialized hooks while keeping the UI components clean and focused on presentation concerns.
