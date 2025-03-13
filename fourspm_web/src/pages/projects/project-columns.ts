import { ODataGridColumn } from '../../components/ODataGrid/ODataGrid';
import { projectStatuses } from './project-statuses';

export const projectColumns: ODataGridColumn[] = [
  { 
    dataField: 'projectNumber', 
    caption: 'Project #', 
    hidingPriority: 2 
  },
  { 
    dataField: 'clientNumber', 
    caption: 'Client #', 
    hidingPriority: 3 
  },
  { 
    dataField: 'name', 
    caption: 'Name', 
    hidingPriority: 8 
  },
  { 
    dataField: 'clientContact', 
    caption: 'Client Contact', 
    hidingPriority: 5 
  },
  { 
    dataField: 'purchaseOrderNumber', 
    caption: 'PO #', 
    hidingPriority: 6 
  },
  {
    dataField: 'projectStatus',
    caption: 'Status',
    hidingPriority: 4,
    lookup: {
      dataSource: projectStatuses,
      valueExpr: 'id',
      displayExpr: 'name'
    }
  }
];
