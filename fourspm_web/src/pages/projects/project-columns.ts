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
export const createProjectColumns = (clientsStore: any, nextProjectNumber?: string): ODataGridColumn[] => {
  // Cast columns to any to avoid type errors with DevExtreme properties
  // This follows the pattern used throughout the application in other modules
  const columns: any[] = [
    { 
      dataField: 'projectNumber', 
      caption: 'Project #', 
      hidingPriority: 10,
      showSummary: true,
      summaryType: 'count'
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
      dataField: 'contactName',
      caption: 'Contact Name',
      hidingPriority: 5
    },
    {
      dataField: 'contactNumber',
      caption: 'Contact Number',
      hidingPriority: 3,
      editorOptions: {
        mask: '(+00)-000000000',
        maskRules: {
          '0': /[0-9]/
        },
        useMaskedValue: true
      }
    },
    {
      dataField: 'contactEmail',
      caption: 'Contact Email',
      hidingPriority: 4
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
  
  // Return the columns with a type cast
  return columns as ODataGridColumn[];
};

