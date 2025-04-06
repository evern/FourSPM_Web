# Variation Deliverables UI Implementation Guide

This document outlines the consolidated implementation approach for the variation deliverables UI components in the FourSPM Web application. The implementation follows the Collection View Doctrine pattern and integrates with the existing variation management system.

## 1. Variation Deliverables Component Implementation

### 1.1 Create Controller Hook

Create a specialized controller hook that extends the base deliverable controller with variation-specific functionality:

```typescript
// src/hooks/controllers/useVariationDeliverableController.ts

import { useState, useCallback, useEffect } from 'react';
import { useDeliverableCollectionController } from './useDeliverableCollectionController';
import { Deliverable } from '../../adapters/deliverable.adapter';
import { 
  addOrUpdateVariationDeliverable, 
  createNewVariationDeliverable,
  getDeliverablesByVariation,
  getProjectDeliverables
} from '../../adapters/deliverable.adapter';
import { ValidationRule } from 'devextreme-react/validator';
import { getDeliverablesByVariationUrl } from '../../config/api-endpoints';
import { variationStatusEnum } from '../../types/enums';

// Extended deliverable interface with UI-specific fields
export interface VariationDeliverableExtended extends Deliverable {
  variationDisplayStatus?: string; // 'Original', 'Added', 'Modified', 'Cancelled'
  isInVariation?: boolean;         // Whether this deliverable is already in the variation
}

// Define variation-specific validation rules
const VARIATION_VALIDATION_RULES: ValidationRule[] = [
  {
    type: 'range',
    message: 'Variation hours must be greater than or equal to 0',
    field: 'variationHours',
    min: 0
  }
  // Additional validation rules as needed
];

export function useVariationDeliverableController(
  userToken: string | undefined,
  variationGuid: string,
  projectGuid: string,
  callbacks?: {
    onUpdateError?: (error: any) => void;
    onDeleteError?: (error: any) => void;
    onCreateError?: (error: any) => void;
  }
) {
  // State for tracking all deliverables - both original and variation
  const [originalDeliverables, setOriginalDeliverables] = useState<Deliverable[]>([]);
  const [variationDeliverables, setVariationDeliverables] = useState<Deliverable[]>([]);
  const [combinedDeliverables, setCombinedDeliverables] = useState<VariationDeliverableExtended[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshCounter, setRefreshCounter] = useState(0);
  
  // Use the base deliverable controller for common operations
  const baseController = useDeliverableCollectionController(
    userToken,
    projectGuid,
    {
      onUpdateError: callbacks?.onUpdateError,
      onDeleteError: callbacks?.onDeleteError
    },
    VARIATION_VALIDATION_RULES
  );
  
  // Effect to load both original and variation deliverables
  useEffect(() => {
    const loadData = async () => {
      if (!userToken) {
        setLoading(false);
        return;
      }
      
      try {
        // Fetch project deliverables
        const projectDeliverableData = await getProjectDeliverables(projectGuid, userToken);
        setOriginalDeliverables(projectDeliverableData);
        
        // Fetch variation deliverables
        const variationDeliverableData = await getDeliverablesByVariation(variationGuid, userToken);
        setVariationDeliverables(variationDeliverableData);
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading deliverables:', error);
        callbacks?.onUpdateError?.(error);
        setLoading(false);
      }
    };
    
    loadData();
  }, [userToken, projectGuid, variationGuid, refreshCounter, callbacks]);
  
  // Effect to combine and process deliverables for display
  useEffect(() => {
    // Process and combine deliverables for display
    const processDeliverables = () => {
      const result: VariationDeliverableExtended[] = [];
      
      // Process original deliverables
      originalDeliverables.forEach(original => {
        // Check if this deliverable is already in the variation
        const variationVersion = variationDeliverables.find(
          vd => vd.originalDeliverableGuid === original.guid
        );
        
        if (variationVersion) {
          // Add the variation version with appropriate status
          const status = variationStatusEnum.find(s => s.id === variationVersion.variationStatus);
          const displayStatus = status?.id === 3 || status?.id === 4 
            ? 'Cancelled' 
            : (variationVersion.variationHours && variationVersion.variationHours !== 0)
              ? 'Modified'
              : 'Added';
          
          result.push({
            ...variationVersion,
            variationDisplayStatus: displayStatus,
            isInVariation: true
          });
        } else {
          // Add the original with option to add to variation
          result.push({
            ...original,
            variationDisplayStatus: 'Original',
            variationHours: 0,  // Default for UI display
            variationStatus: 1, // Default status: Unapproved
            isInVariation: false
          });
        }
      });
      
      // Add any variation-specific deliverables that don't have an original
      variationDeliverables
        .filter(vd => !vd.originalDeliverableGuid)
        .forEach(vd => {
          result.push({
            ...vd,
            variationDisplayStatus: 'Added',
            isInVariation: true
          });
        });
      
      setCombinedDeliverables(result);
    };
    
    processDeliverables();
  }, [originalDeliverables, variationDeliverables]);
  
  // Refresh data
  const refreshData = useCallback(() => {
    setRefreshCounter(prev => prev + 1);
  }, []);
  
  // Custom row updating handler for variation deliverables
  const handleRowUpdating = useCallback(
    async (e) => {
      // Prevent default update behavior
      e.cancel = true;
      
      if (!userToken) {
        callbacks?.onUpdateError?.(new Error('No authentication token'));
        return;
      }
      
      try {
        // Add validation from base controller
        if (baseController.handleRowValidating) {
          const validationResult = baseController.handleRowValidating(e);
          if (!validationResult) {
            return;
          }
        }
        
        // Get the updated data by merging old row with changes
        const updatedData = {
          ...e.oldData,
          ...e.newData,
          variationGuid: variationGuid
        };
        
        // If this is an original deliverable being modified for the first time
        if (!updatedData.isInVariation) {
          updatedData.originalDeliverableGuid = updatedData.guid;
          // Don't send UI-specific fields to the API
          delete updatedData.isInVariation;
          delete updatedData.variationDisplayStatus;
        }
        
        // Update or create the variation deliverable
        await addOrUpdateVariationDeliverable(
          variationGuid,
          updatedData,
          userToken
        );
        
        // Refresh all data
        refreshData();
      } catch (error) {
        console.error('Error updating variation deliverable:', error);
        callbacks?.onUpdateError?.(error);
      }
    },
    [userToken, variationGuid, callbacks, baseController, refreshData]
  );
  
  // Handle adding a deliverable to the variation (for 'Original' rows)
  const handleAddToVariation = useCallback(
    async (deliverable: VariationDeliverableExtended) => {
      if (!userToken) {
        callbacks?.onCreateError?.(new Error('No authentication token'));
        return false;
      }
      
      if (deliverable.isInVariation) {
        // Already in variation, nothing to do
        return true;
      }
      
      try {
        // Prepare the deliverable for variation
        const variationDeliverable = {
          ...deliverable,
          originalDeliverableGuid: deliverable.guid,
          variationGuid: variationGuid,
          variationStatus: 1, // Unapproved
          variationHours: 0    // Default to 0 (will be editable later)
        };
        
        // Don't send UI-specific fields to the API
        delete variationDeliverable.isInVariation;
        delete variationDeliverable.variationDisplayStatus;
        
        await addOrUpdateVariationDeliverable(
          variationGuid,
          variationDeliverable,
          userToken
        );
        
        // Refresh data
        refreshData();
        return true;
      } catch (error) {
        console.error('Error adding deliverable to variation:', error);
        callbacks?.onCreateError?.(error);
        return false;
      }
    },
    [userToken, variationGuid, callbacks, refreshData]
  );
  
  // Handle cancelling a deliverable
  const handleCancelDeliverable = useCallback(
    async (deliverable: VariationDeliverableExtended) => {
      if (!userToken) {
        callbacks?.onCreateError?.(new Error('No authentication token'));
        return false;
      }
      
      try {
        // For original deliverables, we need to create a variation copy first
        let deliverableToCancel = deliverable;
        
        if (!deliverable.isInVariation) {
          // Create a new variation copy for this original deliverable
          const variationDeliverable = {
            ...deliverable,
            originalDeliverableGuid: deliverable.guid,
            variationGuid: variationGuid
          };
          
          // Don't send UI-specific fields to the API
          delete variationDeliverable.isInVariation;
          delete variationDeliverable.variationDisplayStatus;
          
          deliverableToCancel = variationDeliverable;
        }
        
        // Set status to Unapproved Cancellation
        deliverableToCancel.variationStatus = 3; // Unapproved Cancellation
        
        await addOrUpdateVariationDeliverable(
          variationGuid,
          deliverableToCancel,
          userToken
        );
        
        // Refresh data
        refreshData();
        return true;
      } catch (error) {
        console.error('Error cancelling deliverable:', error);
        callbacks?.onCreateError?.(error);
        return false;
      }
    },
    [userToken, variationGuid, callbacks, refreshData]
  );
  
  // Handler for creating brand new deliverables in the variation
  const handleCreateNewDeliverable = useCallback(
    async (newDeliverable: Partial<Deliverable>) => {
      if (!userToken) {
        callbacks?.onCreateError?.(new Error('No authentication token'));
        return false;
      }
      
      try {
        await createNewVariationDeliverable(
          variationGuid,
          newDeliverable,
          userToken
        );
        
        // Refresh data
        refreshData();
        return true;
      } catch (error) {
        console.error('Error creating new variation deliverable:', error);
        callbacks?.onCreateError?.(error);
        return false;
      }
    },
    [userToken, variationGuid, callbacks, refreshData]
  );

  return {
    ...baseController,
    handleRowUpdating,
    handleAddToVariation,
    handleCancelDeliverable,
    handleCreateNewDeliverable,
    refreshData,
    combinedDeliverables,
    loading
  };
}
```

### 1.2 Create Variation Deliverables Component

Create a React component that displays and manages all deliverables for a specific variation, both original project deliverables and those added to the variation:

```typescript
// src/pages/variations/variation-deliverables.tsx

import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/auth';
import { DataGrid, Column, Lookup, Button as GridButton, Export } from 'devextreme-react/data-grid';
import { FilterRow, Paging, Editing, Sorting, Selection } from 'devextreme-react/data-grid';
import { createVariationDeliverableColumns } from './variation-deliverable-columns';
import { useVariationDeliverableController, VariationDeliverableExtended } from '../../hooks/controllers/useVariationDeliverableController';
import { useAreaDataProvider } from '../../hooks/data-providers/useAreaDataProvider';
import { useDisciplineDataProvider } from '../../hooks/data-providers/useDisciplineDataProvider';
import { useDocumentTypeDataProvider } from '../../hooks/data-providers/useDocumentTypeDataProvider';
import { useProjectContext } from '../../contexts/project-context';
import { Button, LoadPanel } from 'devextreme-react';
import { departmentEnum, deliverableTypeEnum, variationStatusEnum } from '../../types/enums';
import { useScreenSizeClass } from '../../utils/media-query';
import notify from 'devextreme/ui/notify';
import { confirm } from 'devextreme/ui/dialog';

interface VariationDeliverableParams {
  variationId: string;
}

export const VariationDeliverables: React.FC = () => {
  const { variationId } = useParams<VariationDeliverableParams>();
  const { user } = useAuth();
  const { currentProject } = useProjectContext();
  const screenSizeClass = useScreenSizeClass();
  const isMobile = screenSizeClass === 'screen-x-small' || screenSizeClass === 'screen-small';
  const [newDeliverablePopupVisible, setNewDeliverablePopupVisible] = useState(false);
  
  // Data providers for lookups
  const { dataSource: areasDataSource } = useAreaDataProvider(user?.token);
  const { dataSource: disciplinesDataSource } = useDisciplineDataProvider(user?.token);
  const { dataSource: documentTypesDataSource } = useDocumentTypeDataProvider(user?.token);
  
  // Error handlers
  const handleUpdateError = (error: any) => {
    notify('Error updating variation deliverable: ' + (error.message || 'Unknown error'), 'error', 3000);
  };
  
  const handleCreateError = (error: any) => {
    notify('Error creating variation deliverable: ' + (error.message || 'Unknown error'), 'error', 3000);
  };
  
  const handleDeleteError = (error: any) => {
    notify('Error deleting variation deliverable: ' + (error.message || 'Unknown error'), 'error', 3000);
  };
  
  // Use variation deliverable controller
  const {
    handleRowUpdating,
    handleRowValidating,
    handleEditorPreparing,
    handleAddToVariation,
    handleCancelDeliverable,
    handleCreateNewDeliverable,
    combinedDeliverables,
    loading,
    refreshData
  } = useVariationDeliverableController(
    user?.token,
    variationId,
    currentProject?.guid || '',
    {
      onUpdateError: handleUpdateError,
      onCreateError: handleCreateError,
      onDeleteError: handleDeleteError
    }
  );
  
  // Create columns with data sources
  const columns = useMemo(() => {
    return createVariationDeliverableColumns(
      areasDataSource,
      disciplinesDataSource,
      documentTypesDataSource,
      isMobile
    );
  }, [areasDataSource, disciplinesDataSource, documentTypesDataSource, isMobile]);

  // Handle add to variation
  const onAddToVariation = (e: any) => {
    const deliverable = e.row.data;
    confirm(`Add deliverable '${deliverable.internalDocumentNumber}' to variation?`, 'Confirm')
      .then((result) => {
        if (result) {
          handleAddToVariation(deliverable)
            .then(success => {
              if (success) {
                notify('Deliverable added to variation', 'success', 2000);
              }
            });
        }
      });
  };

  // Handle cancel deliverable
  const onCancelDeliverable = (e: any) => {
    const deliverable = e.row.data;
    confirm(`Mark deliverable '${deliverable.internalDocumentNumber}' for cancellation?`, 'Confirm')
      .then((result) => {
        if (result) {
          handleCancelDeliverable(deliverable)
            .then(success => {
              if (success) {
                notify('Deliverable marked for cancellation', 'success', 2000);
              }
            });
        }
      });
  };

  // Column for variation status with custom styling
  const renderVariationStatus = (data: any) => {
    const statusClass = `variation-status-${data.value}`;
    const status = variationStatusEnum.find(s => s.id === data.value);
    return <div className={`variation-status ${statusClass}`}>{status?.name || 'Unknown'}</div>;
  };

  // Column for variation display status (Original, Added, Modified, Cancelled)
  const renderDisplayStatus = (data: any) => {
    return <div className={`display-status status-${data.value?.toLowerCase()}`}>{data.value}</div>;
  };
  
  return (
    <div className="variation-deliverables content-block">
      <h2>Variation Deliverables</h2>
      
      <div className="toolbar-row">
        <Button
          text="Refresh"
          icon="refresh"
          type="default"
          stylingMode="outlined"
          onClick={refreshData}
        />
        <Button
          text="Create New Deliverable"
          icon="add"
          type="default"
          stylingMode="contained"
          onClick={() => setNewDeliverablePopupVisible(true)}
        />
      </div>
      
      {/* Loading indicator */}
      <LoadPanel visible={loading} position={{ of: '.variation-deliverables' }} />
      
      {/* Main data grid with combined deliverables */}
      <DataGrid
        dataSource={combinedDeliverables}
        showBorders={true}
        columnAutoWidth={true}
        showRowLines={true}
        rowAlternationEnabled={true}
        hoverStateEnabled={true}
        keyExpr="guid"
        onRowUpdating={handleRowUpdating}
        height={"calc(100vh - 240px)"}
      >
        <Selection mode="single" />
        <FilterRow visible={true} />
        <Sorting mode="multiple" />
        <Paging defaultPageSize={25} />
        <Export enabled={true} allowExportSelectedData={true} />
        <Editing
          mode="cell"
          allowUpdating={true}
          allowDeleting={false}
          allowAdding={false}
        />
        
        {/* Status columns */}
        <Column 
          dataField="variationDisplayStatus" 
          caption="Status" 
          width={120}
          allowEditing={false}
          cellRender={renderDisplayStatus}
          sortIndex={0}
          sortOrder="asc"
        />
        
        <Column 
          dataField="variationStatus" 
          caption="Approval Status" 
          width={150}
          allowEditing={false}
          cellRender={renderVariationStatus}
          lookup={{
            dataSource: variationStatusEnum,
            valueExpr: 'id',
            displayExpr: 'name'
          }}
        />
        
        {/* Document info */}
        <Column dataField="internalDocumentNumber" caption="Doc. Number" allowEditing={false} width={150} />
        <Column dataField="documentTitle" caption="Title" allowEditing={true} />
        
        {/* Area and Department */}
        <Column dataField="areaNumber" caption="Area" allowEditing={false} width={100}>
          <Lookup
            dataSource={areasDataSource}
            valueExpr="number"
            displayExpr={item => item ? `${item.number} - ${item.description}` : ''}
          />
        </Column>
        
        <Column dataField="departmentId" caption="Department" allowEditing={false} width={120}>
          <Lookup
            dataSource={departmentEnum}
            valueExpr="id"
            displayExpr="name"
          />
        </Column>
        
        <Column dataField="discipline" caption="Discipline" allowEditing={false} width={100}>
          <Lookup
            dataSource={disciplinesDataSource}
            valueExpr="code"
            displayExpr="code"
          />
        </Column>
        
        <Column dataField="deliverableTypeId" caption="Type" allowEditing={false} width={120}>
          <Lookup
            dataSource={deliverableTypeEnum}
            valueExpr="id"
            displayExpr="name"
          />
        </Column>
        
        {/* Hours columns */}
        <Column dataField="budgetHours" caption="Budget Hours" dataType="number" allowEditing={false} width={120} />
        <Column 
          dataField="variationHours" 
          caption="Variation Hours" 
          dataType="number" 
          width={120}
          allowEditing={(e) => e.row.data.variationDisplayStatus !== 'Cancelled' && e.row.data.variationStatus !== 2 && e.row.data.variationStatus !== 4} // Only editable if not cancelled or approved
          editorOptions={{
            min: 0,
            showSpinButtons: true
          }}
        />
        <Column dataField="totalHours" caption="Total Hours" dataType="number" allowEditing={false} width={120} />
        
        {/* Cost columns */}
        <Column 
          dataField="hourlyCost" 
          caption="Hourly Cost" 
          dataType="number" 
          format="$0.00"
          width={120}
          allowEditing={(e) => e.row.data.variationDisplayStatus !== 'Cancelled' && e.row.data.variationStatus !== 2 && e.row.data.variationStatus !== 4}
        />
        <Column 
          dataField="totalCost" 
          caption="Total Cost" 
          dataType="number" 
          format="$0.00"
          width={120}
          allowEditing={false}
        />
        
        {/* Comments - always editable */}
        <Column 
          dataField="variationComments" 
          caption="Comments" 
          allowEditing={true}
        />
        
        {/* Action buttons */}
        <Column type="buttons" width={100} caption="Actions">
          <GridButton
            name="add"
            icon="add"
            hint="Add to Variation"
            visible={(e) => e.row.data.variationDisplayStatus === 'Original'}
            onClick={onAddToVariation}
          />
          <GridButton
            name="cancel"
            icon="remove"
            hint="Cancel Deliverable"
            visible={(e) => 
              e.row.data.variationDisplayStatus !== 'Original' && 
              e.row.data.variationDisplayStatus !== 'Cancelled' &&
              e.row.data.variationStatus !== 3 && e.row.data.variationStatus !== 4
            }
            onClick={onCancelDeliverable}
          />
        </Column>
      </DataGrid>
    </div>
  );
};
```

### 1.3 Create New Deliverable Form

Create a form for adding brand new deliverables to a variation:

```typescript
// src/components/NewVariationDeliverableForm/NewVariationDeliverableForm.tsx

import React, { useState } from 'react';
import { TextBox, NumberBox, SelectBox } from 'devextreme-react';
import { Button } from 'devextreme-react/button';
import { Validator, RequiredRule, RangeRule } from 'devextreme-react/validator';
import { departmentEnum, deliverableTypeEnum } from '../../types/enums';
import { Form, SimpleItem, ButtonItem } from 'devextreme-react/form';

interface NewDeliverableFormProps {
  userToken?: string;
  projectGuid: string;
  variationGuid: string;
  onSave: (deliverable: any) => Promise<boolean>;
  onCancel: () => void;
  areasDataSource: any;
  disciplinesDataSource: any;
  documentTypesDataSource: any;
}

export const NewVariationDeliverableForm: React.FC<NewDeliverableFormProps> = ({
  userToken,
  projectGuid,
  variationGuid,
  onSave,
  onCancel,
  areasDataSource,
  disciplinesDataSource,
  documentTypesDataSource
}) => {
  const [formData, setFormData] = useState({
    documentTitle: '',
    areaNumber: '',
    departmentId: '',
    discipline: '',
    deliverableTypeId: 'Task',
    documentType: '',
    variationHours: 0,
    hourlyCost: 0,
    variationComments: ''
  });
  
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    
    // Start with project context
    const newDeliverable = {
      ...formData,
      projectGuid: projectGuid,
      variationGuid: variationGuid,
      variationStatus: 1, // Unapproved
      // Add any other required fields
    };
    
    setLoading(true);
    try {
      const success = await onSave(newDeliverable);
      if (success) {
        onCancel(); // Close the form on success
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleChange = (e: any) => {
    const { name, value } = e.element.getAttribute('name') 
      ? { name: e.element.getAttribute('name'), value: e.value }
      : { name: e.component.option('name'), value: e.value };
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  return (
    <div className="new-deliverable-form">
      <Form
        formData={formData}
        onFieldDataChanged={handleChange}
        labelLocation="top"
        colCount={2}
      >
        <SimpleItem
          dataField="documentTitle"
          editorType="dxTextBox"
          label={{ text: 'Document Title' }}
          editorOptions={{ width: '100%' }}
        >
          <RequiredRule message="Document title is required" />
        </SimpleItem>
        
        <SimpleItem
          dataField="areaNumber"
          editorType="dxSelectBox"
          label={{ text: 'Area' }}
          editorOptions={{
            dataSource: areasDataSource,
            valueExpr: 'number',
            displayExpr: item => item ? `${item.number} - ${item.description}` : '',
            searchEnabled: true
          }}
        >
          <RequiredRule message="Area is required" />
        </SimpleItem>
        
        <SimpleItem
          dataField="departmentId"
          editorType="dxSelectBox"
          label={{ text: 'Department' }}
          editorOptions={{
            dataSource: departmentEnum,
            valueExpr: 'id',
            displayExpr: 'name'
          }}
        >
          <RequiredRule message="Department is required" />
        </SimpleItem>
        
        <SimpleItem
          dataField="discipline"
          editorType="dxSelectBox"
          label={{ text: 'Discipline' }}
          editorOptions={{
            dataSource: disciplinesDataSource,
            valueExpr: 'code',
            displayExpr: 'code'
          }}
        >
          <RequiredRule message="Discipline is required" />
        </SimpleItem>
        
        <SimpleItem
          dataField="deliverableTypeId"
          editorType="dxSelectBox"
          label={{ text: 'Deliverable Type' }}
          editorOptions={{
            dataSource: deliverableTypeEnum,
            valueExpr: 'id',
            displayExpr: 'name'
          }}
        >
          <RequiredRule message="Deliverable type is required" />
        </SimpleItem>
        
        <SimpleItem
          dataField="documentType"
          editorType="dxSelectBox"
          label={{ text: 'Document Type' }}
          editorOptions={{
            dataSource: documentTypesDataSource,
            valueExpr: 'code',
            displayExpr: 'code'
          }}
        >
          <RequiredRule message="Document type is required" />
        </SimpleItem>
        
        <SimpleItem
          dataField="variationHours"
          editorType="dxNumberBox"
          label={{ text: 'Variation Hours' }}
          editorOptions={{
            min: 0,
            showSpinButtons: true
          }}
        >
          <RequiredRule message="Variation hours is required" />
          <RangeRule min={0} message="Hours must be greater than or equal to 0" />
        </SimpleItem>
        
        <SimpleItem
          dataField="hourlyCost"
          editorType="dxNumberBox"
          label={{ text: 'Hourly Cost' }}
          editorOptions={{
            min: 0,
            showSpinButtons: true,
            format: '$0.00'
          }}
        >
          <RequiredRule message="Hourly cost is required" />
          <RangeRule min={0} message="Cost must be greater than or equal to 0" />
        </SimpleItem>
        
        <SimpleItem
          dataField="variationComments"
          editorType="dxTextArea"
          label={{ text: 'Comments' }}
          colSpan={2}
          editorOptions={{
            height: 100
          }}
        />
        
        <ButtonItem
          horizontalAlignment="right"
          colSpan={2}
          buttonOptions={{
            text: 'Save',
            type: 'success',
            useSubmitBehavior: true,
            onClick: handleSubmit,
            disabled: loading
          }}
        />
        
        <ButtonItem
          horizontalAlignment="right"
          buttonOptions={{
            text: 'Cancel',
            type: 'normal',
            onClick: onCancel,
            disabled: loading
          }}
        />
      </Form>
    </div>
  );
};
```

## 2. Integration with Variation Detail View

### 2.1 Update Variation Detail Component

Update the variation detail component to include the variation deliverables grid and new deliverable popup:

```typescript
// src/pages/variations/variation-detail.tsx

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/auth';
import { Variation, getVariationById } from '../../adapters/variation.adapter';
import { Tabs, Tab } from 'devextreme-react/tabs';
import { Popup } from 'devextreme-react/popup';
import { VariationDeliverables } from './variation-deliverables';
import { VariationGeneral } from './variation-general';
import { NewVariationDeliverableForm } from '../../components/NewVariationDeliverableForm/NewVariationDeliverableForm';
import { useAreaDataProvider } from '../../hooks/data-providers/useAreaDataProvider';
import { useDisciplineDataProvider } from '../../hooks/data-providers/useDisciplineDataProvider';
import { useDocumentTypeDataProvider } from '../../hooks/data-providers/useDocumentTypeDataProvider';
import { Button } from 'devextreme-react/button';
import notify from 'devextreme/ui/notify';

interface VariationDetailParams {
  variationId: string;
}

export const VariationDetail: React.FC = () => {
  const { variationId } = useParams<VariationDetailParams>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [variation, setVariation] = useState<Variation | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0);
  const [newDeliverablePopupVisible, setNewDeliverablePopupVisible] = useState(false);
  
  // Data providers for lookups in new deliverable form
  const { dataSource: areasDataSource } = useAreaDataProvider(user?.token);
  const { dataSource: disciplinesDataSource } = useDisciplineDataProvider(user?.token);
  const { dataSource: documentTypesDataSource } = useDocumentTypeDataProvider(user?.token);
  
  // Reference to the variation deliverables component to trigger refresh
  const variationDeliverablesRef = React.useRef<any>(null);
  
  useEffect(() => {
    const fetchVariation = async () => {
      if (!user?.token || !variationId) {
        setLoading(false);
        return;
      }
      
      try {
        const data = await getVariationById(variationId, user.token);
        setVariation(data);
        setLoading(false);
      } catch (error: any) {
        notify('Error loading variation: ' + (error.message || 'Unknown error'), 'error', 3000);
        setLoading(false);
      }
    };
    
    fetchVariation();
  }, [variationId, user]);
  
  const handleTabChange = (e: any) => {
    setSelectedTab(e.value);
  };
  
  const handleNewDeliverableSave = async (deliverable: any) => {
    if (!user?.token) {
      notify('Authentication required', 'error', 3000);
      return false;
    }
    
    try {
      // Use the controller method from the child component via ref
      if (variationDeliverablesRef.current) {
        const result = await variationDeliverablesRef.current.handleCreateNewDeliverable(deliverable);
        if (result) {
          notify('New deliverable created successfully', 'success', 3000);
          setNewDeliverablePopupVisible(false);
          return true;
        }
      }
      return false;
    } catch (error: any) {
      notify('Error creating deliverable: ' + (error.message || 'Unknown error'), 'error', 3000);
      return false;
    }
  };
  
  if (loading) {
    return <div className="loading-indicator">Loading variation...</div>;
  }
  
  if (!variation) {
    return (
      <div className="not-found">
        <h2>Variation Not Found</h2>
        <Button
          text="Back to Variations"
          onClick={() => navigate('/variations')}
        />
      </div>
    );
  }
  
  return (
    <div className="variation-detail">
      <div className="header-row">
        <h2>Variation: {variation.variationNumber} - {variation.title}</h2>
        <Button
          text="Back to Variations"
          onClick={() => navigate('/variations')}
          stylingMode="outlined"
        />
      </div>
      
      <Tabs
        selectedIndex={selectedTab}
        onValueChanged={handleTabChange}
        className="tab-navigation"
      >
        <Tab text="General" />
        <Tab text="Deliverables" />
      </Tabs>
      
      <div className="tab-content">
        {selectedTab === 0 && (
          <VariationGeneral variation={variation} />
        )}
        {selectedTab === 1 && (
          <React.Fragment>
            <VariationDeliverables
              ref={variationDeliverablesRef}
              onNewDeliverableClick={() => setNewDeliverablePopupVisible(true)}
            />
            
            {/* New Deliverable Popup */}
            <Popup
              visible={newDeliverablePopupVisible}
              onHiding={() => setNewDeliverablePopupVisible(false)}
              title="Create New Deliverable"
              showCloseButton={true}
              width="800px"
              height="auto"
              resizeEnabled={false}
            >
              <NewVariationDeliverableForm
                userToken={user?.token}
                projectGuid={variation.projectGuid}
                variationGuid={variationId}
                onSave={handleNewDeliverableSave}
                onCancel={() => setNewDeliverablePopupVisible(false)}
                areasDataSource={areasDataSource}
                disciplinesDataSource={disciplinesDataSource}
                documentTypesDataSource={documentTypesDataSource}
              />
            </Popup>
          </React.Fragment>
        )}
      </div>
    </div>
  );
};
```

### 2.2 Create Basic CSS Styles

Create or update styles for the variation components:

```css
/* src/pages/variations/variation.scss */

.variation-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
  
  .header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }
  
  .tab-navigation {
    margin-bottom: 16px;
  }
  
  .tab-content {
    padding: 16px;
    background-color: #fff;
    border-radius: 4px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
}

.toolbar-row {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.new-deliverable-form {
  padding: 16px;
  
  .dx-buttongroup {
    margin-top: 24px;
  }
}

/* Styles for variation status */
.variation-status {
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 500;
  text-align: center;
}

.variation-status-1 {
  background-color: #FFF9C4;
  color: #F57F17;
}

.variation-status-2 {
  background-color: #C8E6C9;
  color: #2E7D32;
}

.variation-status-3 {
  background-color: #FFCCBC;
  color: #D84315;
}

.variation-status-4 {
  background-color: #BBDEFB;
  color: #1565C0;
}

/* Styles for display status */
.display-status {
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 500;
  text-align: center;
}

.status-original {
  background-color: #E0E0E0;
  color: #616161;
}

.status-added {
  background-color: #C5CAE9;
  color: #303F9F;
}

.status-modified {
  background-color: #B3E5FC;
  color: #0288D1;
}

.status-cancelled {
  background-color: #FFCCBC;
  color: #D84315;
}
```

### 2.3 Update Routing

Update app routing to include the variation detail page:

```typescript
// In src/app-routes.tsx (or your routing configuration file)

import { VariationDetail } from './pages/variations/variation-detail';

// Add to your routes array
{
  path: '/variations/:variationId',
  element: <VariationDetail />
}
```

## 3. Implementation Notes

### 3.1 Component Relationships

- `variation-detail.tsx` serves as the container with tabs for different sections
- `variation-deliverables.tsx` provides a consolidated view for managing all deliverables
- `NewVariationDeliverableForm` handles creation of brand new deliverables in a popup

### 3.2 State Management

- The consolidated UI combines original and variation deliverables in a single data source
- Status indicators clearly distinguish between different deliverable states (Original, Added, Modified, Cancelled)
- The controller maintains both original and variation copies, merging them for display

### 3.3 Key Features

- **Single Grid View**: All deliverables (original and variation) appear in one consolidated view
- **Contextual Actions**: Action buttons change based on deliverable status
   - Original deliverables: Add to Variation button 
   - Modified deliverables: Cancel button
- **Visual Status Indicators**: Clear visual distinction between different states
- **In-line Editing**: Direct modification of variation hours and other properties
- **Cancellation Flow**: Streamlined process for marking deliverables for cancellation

### 3.4 Security Considerations

- All API calls include authentication tokens
- Validation occurs on both client and server side
- Permissions handling is managed by the backend
- Status-based restrictions on what can be edited (approved items are read-only)
