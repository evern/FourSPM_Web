import { ODataGridColumn } from '../../components/ODataGrid/ODataGrid';
import { API_CONFIG } from '../../config/api';

// Department is now an enum, so we define the lookup values here
const departmentEnum = [
  { id: 0, name: 'Administration' },
  { id: 1, name: 'Design' },
  { id: 2, name: 'Engineering' },
  { id: 3, name: 'Management' }
];

// DeliverableType is now an enum, so we define the lookup values here
const deliverableTypeEnum = [
  { id: 'Task', name: 'Task' },
  { id: 'NonDeliverable', name: 'Non Deliverable' },
  { id: 'DeliverableICR', name: 'Deliverable ICR' },
  { id: 'Deliverable', name: 'Deliverable' }
];

export const deliverableColumns: ODataGridColumn[] = [
  {
    dataField: 'project.client.number',
    caption: 'Client No.',
    hidingPriority: 0,
    allowEditing: false // Read-only field
  },
  {
    dataField: 'projectNumber',
    caption: 'Project No.',
    hidingPriority: 0,
    allowEditing: false // Read-only field
  },
  {
    dataField: 'areaNumber',
    caption: 'Area No.',
    hidingPriority: 1
  },
  {
    dataField: 'discipline',
    caption: 'Discipline',
    hidingPriority: 2
  },
  {
    dataField: 'documentType',
    caption: 'Document Type',
    hidingPriority: 3
  },
  {
    dataField: 'departmentId',
    caption: 'Department',
    hidingPriority: 4,
    lookup: {
      dataSource: departmentEnum,
      valueExpr: 'id',
      displayExpr: 'name'
    }
  },
  {
    dataField: 'deliverableTypeId',
    caption: 'Deliverable Type',
    hidingPriority: 11,
    lookup: {
      dataSource: deliverableTypeEnum,
      valueExpr: 'id',
      displayExpr: 'name'
    }
  },
  {
    dataField: 'internalDocumentNumber',
    caption: 'Internal Doc. No.',
    hidingPriority: 12 // Will be hidden last
  },
  {
    dataField: 'clientDocumentNumber',
    caption: 'Client Doc. No.',
    hidingPriority: 6
  },
  {
    dataField: 'documentTitle',
    caption: 'Document Title',
    hidingPriority: 10  // Will be hidden second to last
  },
  {
    dataField: 'budgetHours',
    caption: 'Budget Hours',
    hidingPriority: 7
  },
  {
    dataField: 'variationHours',
    caption: 'Variation Hours',
    hidingPriority: 8
  },
  {
    dataField: 'totalHours',
    caption: 'Total Hours',
    hidingPriority: 9,
    allowEditing: false // Read-only calculated field
  },
  {
    dataField: 'bookingCode',
    caption: 'Booking Code',
    hidingPriority: 5,
    allowEditing: false // Read-only calculated field
  }
];
