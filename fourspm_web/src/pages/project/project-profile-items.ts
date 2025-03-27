import { IGroupItemProps } from 'devextreme-react/form';
import { Project, Client } from '../../types/index';
import { projectStatuses } from '../../types/index';

// Constants
const PROGRESS_START_TOOLTIP = 'Deliverables progress period will refresh weekly on the provided day of week';

/**
 * Creates the form items configuration for the Project Profile form
 * @param projectData Current project data
 * @param isEditing Whether the form is in edit mode
 * @param onClientChange Event handler for client selection changes
 * @param isLoadingClient Whether client data is currently loading
 * @param clients Array of available clients
 * @returns Form items configuration
 */
export const createProjectFormItems = (
  projectData: Project,
  isEditing: boolean,
  onClientChange: (e: any) => void,
  isLoadingClient: boolean = false,
  clients: Client[] = []
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
        editorOptions: { readOnly: true },
        validationRules: [{ type: 'required', message: 'Project number is required' }]
      },
      {
        itemType: 'simple',
        dataField: 'name',
        editorOptions: { readOnly: !isEditing },
        validationRules: [{ type: 'required', message: 'Project name is required' }]
      },
      {
        itemType: 'simple',
        dataField: 'projectStatus',
        editorType: 'dxSelectBox',
        editorOptions: { 
          items: projectStatuses,
          valueExpr: 'id',
          displayExpr: 'name',
          readOnly: !isEditing,
          searchEnabled: isEditing,
          showClearButton: isEditing
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
      {
        dataField: 'clientGuid',
        label: { text: 'Client' },
        editorType: 'dxSelectBox',
        editorOptions: {
          dataSource: clients,
          valueExpr: 'guid',
          displayExpr: item => item ? `${item.number} - ${item.description}` : '',
          readOnly: !isEditing,
          searchEnabled: isEditing,
          showClearButton: isEditing,
          onValueChanged: onClientChange
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

/**
 * Returns the client display value based on the project data, clients array, and loading status
 * @param projectData Current project data
 * @param clients Array of available clients
 * @param isLoadingClient Whether client data is currently loading
 * @returns Client display value
 */
const getClientDisplayValue = (projectData: Project, clients: Client[], isLoadingClient: boolean): string => {
  // If client is loading, show loading message
  if (isLoadingClient) return 'Loading client details...';
  
  // If client object exists and has description, use it
  if (projectData.client?.description) {
    return `${projectData.client.number || ''} - ${projectData.client.description}`;
  }
  
  // Find the client in the clients array if available
  if (projectData.clientGuid && clients.length > 0) {
    const client = clients.find(c => c.guid === projectData.clientGuid);
    if (client) {
      return `${client.number || ''} - ${client.description || ''}`;
    }
    return 'Loading client details...';
  }
  
  // Default fallback
  return 'No client selected';
};
