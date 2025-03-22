# Single Entity CRUD Module Documentation

## Overview

This document provides a guide for creating single entity CRUD (Create, Read, Update, Delete) modules in the FourSPM Web application, using the [Project Profile](../src/pages/project/project-profile.tsx) component as an example. These modules allow users to view and edit details of a single entity instance, as opposed to collection views that display multiple instances.

For information about the underlying API service architecture, please refer to the [API Services Documentation](./api-services-documentation.md).

## Architecture

Single entity CRUD modules in FourSPM Web follow a layered architecture consisting of:

1. **UI Component Layer**: The main React component (e.g., `ProjectProfile.tsx`)
2. **Form Configuration Layer**: Separate configuration for form items (e.g., `project-form-items.ts`)
3. **Custom Hooks Layer**: Specialized hooks for state management and business logic (e.g., `useProjectEdit.ts`, `useClientData.ts`)
4. **Service Layer**: API services for data fetching and persistence (e.g., `project.service.ts`)

This architecture promotes separation of concerns, reusability, and maintainability.

## Step-by-Step Guide

### 1. Create the Main Component File

Start by creating your main component file (e.g., `entity-profile.tsx`) with the following structure:

```tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import './entity-profile.scss'; // Create matching SCSS file
import Form from 'devextreme-react/form';
import { useParams } from 'react-router-dom';
import { getEntityDetails } from '../../services/entity.service';
import { EntityDetails } from '../../types/entity';
import { useAuth } from '../../contexts/auth';
import { Button } from 'devextreme-react/button';
import notify from 'devextreme/ui/notify';
import { ScrollView } from 'devextreme-react/scroll-view';
import { LoadPanel, LoadIndicator } from 'devextreme-react/load-panel';

// Import custom hooks
import { useEntityEdit } from '../../hooks/useEntityEdit';

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

### 2. Set Up Component State and Hooks

Define the component state and integrate custom hooks:

```tsx
// Extract parameters from URL
const { entityId } = useParams<EntityProfileParams>();
const { user } = useAuth();

// Component state
const [entityData, setEntityData] = useState<EntityDetails | null>(null);
const [isLoading, setIsLoading] = useState(true);
const scrollViewRef = useRef<ScrollView>(null);

// Use custom hooks
const { isEditing, isSaving, formRef, onFormRef, startEdit, cancelEdit, saveEntityChanges } = 
  useEntityEdit(entityId, user?.token);
```

### 3. Implement Data Fetching

Add a `useEffect` hook to fetch entity data when the component mounts:

```tsx
// Fetch entity data on component mount
useEffect(() => {
  const fetchEntityData = async () => {
    if (user?.token && entityId) {
      setIsLoading(true);
      try {
        const data = await getEntityDetails(entityId, user.token);
        setEntityData(data);
      } catch (error) {
        console.error('Error fetching entity data:', error);
        notify('Error loading entity data', 'error', 3000);
      } finally {
        setIsLoading(false);
      }
    }
  };
  fetchEntityData();
}, [entityId, user?.token]);
```

### 4. Create Save Handler

Implement a handler for saving entity changes:

```tsx
// Handle save button click
const handleSave = useCallback(async () => {
  if (!entityData) return;
  
  const updatedEntity = await saveEntityChanges(entityData);
  if (updatedEntity) {
    setEntityData(updatedEntity);
  }
}, [entityData, saveEntityChanges]);
```

### 5. Render Component UI

Implement the rendering logic with loading state, form, and action buttons:

```tsx
// Loading state
if (isLoading || !entityData) {
  return (
    <div className="profile-container">
      <div className="custom-grid-wrapper">
        <div className="grid-custom-title">Loading Entity Details...</div>
      </div>
      <div className="profile-loading-container">
        <LoadIndicator width={50} height={50} visible={true} />
        <div className="loading-message">Loading entity data...</div>
      </div>
    </div>
  );
}

// Create form items for the current entity data
const formItems = createEntityFormItems(entityData, isEditing);

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
          {entityData ? `Entity: ${entityData.name}` : 'Entity Details'}
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
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                text="Save"
                type="success"
                stylingMode="contained"
                onClick={handleSave}
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
        ref={scrollViewRef}
        height={"calc(100vh - 200px)"}
        width={"100%"}
      >
        <div className="form-container">
          <Form
            ref={onFormRef}
            formData={entityData}
            items={formItems}
            labelLocation="top"
            minColWidth={233}
            colCount="auto"
          />
        </div>
      </ScrollView>
    </div>
  </div>
);
```

### 6. Create Form Items Configuration

Create a separate file (e.g., `entity-form-items.ts`) to define the form structure:

```typescript
import { IGroupItemProps } from 'devextreme-react/form';
import { EntityDetails } from '../../types/entity';

/**
 * Creates the form items configuration for the Entity Profile form
 * @param entityData Current entity data
 * @param isEditing Whether the form is in edit mode
 * @returns Form items configuration
 */
export const createEntityFormItems = (
  entityData: EntityDetails,
  isEditing: boolean,
): IGroupItemProps[] => [
  {
    itemType: 'group',
    caption: 'Entity Information',
    colCountByScreen: {
      xs: 1,    
      sm: 1,    
      md: 2,    
      lg: 2     
    },
    items: [
      { 
        itemType: 'simple',
        dataField: 'entityId',
        editorOptions: { readOnly: true }
      },
      {
        itemType: 'simple',
        dataField: 'name',
        editorOptions: { readOnly: !isEditing }
      },
      // Add more form fields as needed
    ]
  },
  // Add more form groups as needed
];
```

### 7. Create Custom Edit Hook

Implement a custom hook to manage editing state and operations (e.g., `useEntityEdit.ts`):

```typescript
import { useState, useCallback } from 'react';
import { EntityDetails } from '../types/entity';
import { updateEntity } from '../services/entity.service';
import notify from 'devextreme/ui/notify';
import Form from 'devextreme-react/form';

/**
 * Hook to manage entity editing state and operations
 * @param entityId The entity GUID to edit
 * @param userToken The user's authentication token
 * @returns Object containing editing state and handler functions
 */
export const useEntityEdit = (entityId: string | undefined, userToken: string | undefined) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [formRef, setFormRef] = useState<Form | null>(null);

  /**
   * Save entity changes
   * @param currentData Current entity data object
   * @returns Updated entity data if successful, null otherwise
   */
  const saveEntityChanges = useCallback(async (currentData: EntityDetails): Promise<EntityDetails | null> => {
    if (!formRef || !entityId || !userToken) return null;

    setIsSaving(true);
    try {
      const formData = formRef.instance.option('formData');
      const result = await updateEntity(entityId, formData, userToken);
      
      if (result) {
        notify('Entity updated successfully', 'success', 3000);
        setIsEditing(false);
        return result;
      }
      return null;
    } catch (error) {
      console.error('Error updating entity:', error);
      notify('Error updating entity', 'error', 3000);
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [formRef, entityId, userToken]);

  /**
   * Set the form reference for accessing form data
   */
  const onFormRef = useCallback((ref: Form) => {
    setFormRef(ref);
  }, []);

  /**
   * Start editing the entity
   */
  const startEdit = useCallback(() => {
    setIsEditing(true);
  }, []);

  /**
   * Cancel editing and revert changes
   */
  const cancelEdit = useCallback(() => {
    setIsEditing(false);
    // Reset form data to original entity data
    if (formRef) {
      formRef.instance.resetValues();
    }
  }, [formRef]);

  return {
    isEditing,
    isSaving,
    formRef,
    onFormRef,
    startEdit,
    cancelEdit,
    saveEntityChanges
  };
};
```

### 8. Create Entity Service

Implement API service functions for your entity (e.g., `entity.service.ts`):

```typescript
import { sharedApiService } from './shared-api.service';
import { EntityDetails } from '../types/entity';

/**
 * Retrieves detailed entity information by ID
 * @param entityId Entity GUID
 * @param token Authentication token
 * @returns Promise resolving to entity details
 */
export const getEntityDetails = async (
  entityId: string,
  token: string
): Promise<EntityDetails> => {
  try {
    const data = await sharedApiService.getById<any>(
      '/odata/v1/Entities',
      entityId,
      token,
      '$expand=RelatedEntities'
    );
    
    // Transform API response to match component data structure if needed
    return {
      guid: data.guid,
      entityId: data.entityId,
      name: data.name,
      // Map other properties
    };
  } catch (error) {
    console.error('Error fetching entity details:', error);
    throw error;
  }
};

/**
 * Updates an entity with new data
 * @param entityId Entity GUID
 * @param entityData Updated entity data
 * @param token Authentication token
 * @returns Promise resolving to updated entity details
 */
export const updateEntity = async (
  entityId: string,
  entityData: EntityDetails,
  token: string
): Promise<EntityDetails | null> => {
  try {
    // Prepare data for API if needed
    const apiData = {
      name: entityData.name,
      // Include other fields that should be updated
    };

    // Update entity through API
    const updatedData = await sharedApiService.update<any>(
      '/odata/v1/Entities',
      entityId,
      apiData,
      token
    );

    if (updatedData) {
      // Fetch the updated entity to get all data including related entities
      return await getEntityDetails(entityId, token);
    }
    
    return null;
  } catch (error) {
    console.error('Error updating entity:', error);
    throw error;
  }
};
```

## Advanced Patterns

### Handling Related Entities

The [Project Profile](../src/pages/project/project-profile.tsx) component demonstrates how to handle related entities (like clients). To implement this pattern:

1. Create a custom hook for the related entity data (e.g., `useClientData.ts`)
2. Pass the related entity data and loading state to the form items creation function
3. Implement UI elements that show loading states for related data
4. Handle selection changes for related entities with proper form updates

### Form Validation

To add validation to your entity form:

1. Define validation rules in your form items configuration
2. Implement client-side validation in your custom edit hook
3. Handle server-side validation errors in your API service functions

### Responsive Layout

The component uses several techniques for responsiveness:

1. The `useScreenSize` hook to detect screen dimensions
2. `colCountByScreen` property in form groups to adjust columns based on screen size
3. CSS Grid layout with appropriate media queries in the SCSS file

## CSS Structure

Create a matching SCSS file (e.g., `entity-profile.scss`) with these core styles:

```scss
.profile-container {
  height: 100%;
  position: relative;
  
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
      
      .action-buttons {
        display: flex;
        gap: 8px;
      }
    }
  }
  
  .scrollable-content {
    flex: 1;
  }
  
  .form-container {
    padding: 16px;
  }
  
  .profile-loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: calc(100% - 48px);
    
    .loading-message {
      margin-top: 16px;
    }
  }
}
```

## Common Patterns and Best Practices

1. **Separation of Concerns**: Keep UI components, form configuration, business logic, and API services in separate files
2. **Custom Hooks for Reusability**: Create custom hooks for common operations like editing, data fetching, and validation
3. **Loading States**: Always show loading indicators during asynchronous operations
4. **Error Handling**: Implement consistent error handling and user notifications
5. **Form Reset**: Provide a way to cancel edits and reset the form to its original state
6. **Responsive Design**: Ensure the component works well on different screen sizes
7. **Console Logging**: Include strategic console logging during development, but remove or disable in production

## Troubleshooting

### Common Issues

1. **Form Data Not Updating**: Ensure the form reference is correctly set and accessed
2. **API Errors**: Check network requests, authentication tokens, and API endpoint URLs
3. **Loading States**: Verify that loading states are properly initialized and updated
4. **Related Entity Data**: Make sure related entity data is loaded and passed correctly to form items

## Conclusion

This guide provides a foundation for creating single entity CRUD modules in the FourSPM Web application. By following these patterns and practices, you can create consistent, maintainable, and user-friendly interfaces for managing entity data.

For more information about the underlying API service architecture, please refer to the [API Services Documentation](./api-services-documentation.md).
