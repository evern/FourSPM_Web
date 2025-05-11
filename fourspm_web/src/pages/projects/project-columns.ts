import type { ODataGridColumn } from '../../components';
import { projectStatuses } from '../../types/index';

// Constants for reusable text
const CLIENT_CONTACT_PLACEHOLDER = 'Auto-filled on client selection';
const PROGRESS_START_TOOLTIP = 'Deliverables progress period will refresh weekly on the provided day of week';

/**
 * Creates column definitions for the Projects grid with client information
 * @param clientsStore - The OData store for clients lookup from useClientDataProvider
 * @param nextProjectNumber - The next auto-incremented project number to use for new projects
 * @returns Array of column definitions for the projects grid
 */
export const createProjectColumns = (clientsStore: any, nextProjectNumber?: string): ODataGridColumn[] => [
    { 
      dataField: 'projectNumber', 
      caption: 'Project #', 
      hidingPriority: 10,
      editorOptions: {
        placeholder: nextProjectNumber ? `Suggested: ${nextProjectNumber}` : undefined
      }
    },
    { 
      dataField: 'clientGuid', 
      caption: 'Client', 
      hidingPriority: 7,
      lookup: {
        dataSource: clientsStore,
        valueExpr: 'guid',
        displayExpr: (item: any) => item ? `${item.number} - ${item.description}` : ''
      }
    },
    { 
      dataField: 'name', 
      caption: 'Name', 
      hidingPriority: 9  
    },
    {
      dataField: 'client.clientContactName',
      caption: 'Client Contact',
      hidingPriority: 5,  
      allowEditing: false, 
      customizeText: (cellInfo: { value: string | null }) => {
        return cellInfo.value || CLIENT_CONTACT_PLACEHOLDER;
      },
      cellClass: 'faded-placeholder'
    },
    {
      dataField: 'client.clientContactNumber',
      caption: 'Contact Number',
      hidingPriority: 3,  
      allowEditing: false, 
      customizeText: (cellInfo: { value: string | null }) => {
        return cellInfo.value || CLIENT_CONTACT_PLACEHOLDER;
      },
      cellClass: 'faded-placeholder'
    },
    {
      dataField: 'client.clientContactEmail',
      caption: 'Contact Email',
      hidingPriority: 4,  
      allowEditing: false, 
      customizeText: (cellInfo: { value: string | null }) => {
        return cellInfo.value || CLIENT_CONTACT_PLACEHOLDER;
      },
      cellClass: 'faded-placeholder'
    },
    { 
      dataField: 'purchaseOrderNumber', 
      caption: 'PO #', 
      hidingPriority: 8  
    },
    {
      dataField: 'projectStatus',
      caption: 'Status',
      hidingPriority: 6,  
      lookup: {
        dataSource: projectStatuses,
        valueExpr: 'id',
        displayExpr: 'name'
      }
    },
    {
      dataField: 'progressStart',
      caption: 'Progress Start',
      hidingPriority: 2,  
      dataType: 'date',
      customizeText: (cellInfo: { value: string | null }) => {
        if (!cellInfo.value) return '';
        const date = new Date(cellInfo.value);
        return date.toLocaleDateString();
      },
      tooltip: PROGRESS_START_TOOLTIP
    },
    {
      dataField: 'created',
      caption: 'Created',
      hidingPriority: 1,  
      dataType: 'date',
      cellClass: 'faded-placeholder',
      allowEditing: false 
    }
];

