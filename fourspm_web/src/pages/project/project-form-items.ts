import { IGroupItemProps } from 'devextreme-react/form';
import { ProjectDetails } from '../../types/project';
import { projectStatuses } from '../../types/project';
import { clientsStore } from '../../stores/odataStores';

// Constants
const PROGRESS_START_TOOLTIP = 'Deliverables progress period will refresh weekly on the provided day of week';

/**
 * Creates the form items configuration for the Project Profile form
 * @param projectData Current project data
 * @param isEditing Whether the form is in edit mode
 * @param onClientChange Event handler for client selection changes
 * @param clientDetails Client details data object
 * @param isLoadingClient Whether client data is currently loading
 * @returns Form items configuration
 */
export const createProjectFormItems = (
  projectData: ProjectDetails,
  isEditing: boolean,
  onClientChange: (e: any) => void,
  clientDetails: any = null,
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
          displayFormat: 'MM/dd/yyyy'
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
                 (clientDetails ? 
                 `${clientDetails.number} - ${clientDetails.description}` : 
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
        dataField: 'clientContactName',
        label: { text: 'Client Contact' },
        editorOptions: { readOnly: !isEditing }
      },
      {
        itemType: 'simple',
        dataField: 'clientContactNumber',
        label: { text: 'Contact Number' },
        editorOptions: { readOnly: !isEditing }
      },
      {
        itemType: 'simple',
        dataField: 'clientContactEmail',
        label: { text: 'Contact Email' },
        editorOptions: { 
          readOnly: !isEditing,
          mode: 'email'
        }
      }
    ].filter(Boolean) // Filter out null items
  }
];
