import { IGroupItemProps } from 'devextreme-react/form';
import { Project, Client } from '../../types/index';
import { projectStatuses } from '../../types/index';
import { clientsStore } from '../../stores/odataStores';
import { EntityState } from '../../hooks/interfaces/entity-hook.interfaces';

// Constants
const PROGRESS_START_TOOLTIP = 'Deliverables progress period will refresh weekly on the provided day of week';

/**
 * Creates the form items configuration for the Project Profile form
 * @param projectData Current project data
 * @param isEditing Whether the form is in edit mode
 * @param onClientChange Event handler for client selection changes
 * @param isLoadingClient Whether client data is currently loading
 * @returns Form items configuration
 */
export const createProjectFormItems = (
  projectData: Project,
  isEditing: boolean,
  onClientChange: (e: any) => void,
  isLoadingClient: boolean = false
): IGroupItemProps[] => [
  {
    itemType: 'group',
    caption: 'Project Information',
    colCountByScreen: {
      xs: 1,    
      sm: 1,    
      md: 2,    
      lg: 2     
    },
    items: [
      { 
        itemType: 'simple',
        dataField: 'projectNumber',
        editorOptions: { readOnly: true }
      },
      {
        itemType: 'simple',
        dataField: 'name',
        editorOptions: { readOnly: !isEditing }
      },
      {
        itemType: 'simple',
        dataField: 'projectStatus',
        editorType: isEditing ? 'dxSelectBox' : 'dxTextBox',
        editorOptions: isEditing ? { 
          items: projectStatuses,
          valueExpr: 'id',
          displayExpr: 'name'
        } : {
          readOnly: true,
          value: projectData.projectStatus ? 
                 projectStatuses.find(s => s.id === projectData.projectStatus)?.name || projectData.projectStatus : 
                 ''
        }
      },
      {
        itemType: 'simple',
        dataField: 'progressStart',
        label: { 
          text: 'Progress Start',
          hint: PROGRESS_START_TOOLTIP
        },
        editorType: isEditing ? 'dxDateBox' : 'dxTextBox',
        editorOptions: isEditing ? {
          type: 'date',
          // Format the date exactly as it is in the grid view
          displayFormat: function(date) {
            return date ? new Date(date).toLocaleDateString() : '';
          },
          useMaskBehavior: true,
          pickerType: 'calendar'
        } : {
          readOnly: true,
          value: projectData.progressStart ? new Date(projectData.progressStart).toLocaleDateString() : ''
        }
      },
      {
        itemType: 'simple',
        dataField: 'purchaseOrderNumber',
        label: { text: 'Purchase Order #' },
        editorOptions: { readOnly: !isEditing }
      }
    ]
  },
  {
    itemType: 'group',
    caption: 'Client Information',
    colCountByScreen: {
      xs: 1,    
      sm: 1,    
      md: 2,    
      lg: 2     
    },
    items: [
      // Client selection/display
      {
        itemType: 'simple',
        dataField: 'clientGuid',
        label: { text: 'Client' },
        editorType: isEditing ? 'dxSelectBox' : 'dxTextBox',
        editorOptions: isEditing ? { 
          dataSource: clientsStore,
          valueExpr: 'guid',
          displayExpr: (item: any) => item ? `${item.number} - ${item.description}` : '',
          onValueChanged: onClientChange
        } : {
          readOnly: true,
          value: isLoadingClient ? 'Loading client details...' :
                 (projectData.client && projectData.client.number ? 
                 `${projectData.client.number} - ${projectData.client.description}` : 
                 (projectData.clientGuid ? 'Client data not available' : 'No client selected'))
        }
      },
      // Loading indicator (only shown when loading)
      isLoadingClient ? {
        itemType: 'empty',
        cssClass: 'loading-indicator-text'
      } : null,
      // Client contact fields
      {
        itemType: 'simple',
        dataField: 'client.clientContactName',
        label: { text: 'Client Contact' },
        editorOptions: { readOnly: !isEditing }
      },
      {
        itemType: 'simple',
        dataField: 'client.clientContactNumber',
        label: { text: 'Contact Number' },
        editorOptions: { readOnly: !isEditing }
      },
      {
        itemType: 'simple',
        dataField: 'client.clientContactEmail',
        label: { text: 'Contact Email' },
        editorOptions: { 
          readOnly: !isEditing,
          mode: 'email'
        }
      }
    ].filter(Boolean) // Filter out null items
  }
];
