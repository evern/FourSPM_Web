import { ODataGridColumn } from '../../components/ODataGrid/ODataGrid';
import { API_CONFIG } from '../../config/api';

// Department is now an enum, so we define the lookup values here
const departmentEnum = [
  { id: 'Administration', name: 'Administration' },
  { id: 'Design', name: 'Design' },
  { id: 'Engineering', name: 'Engineering' },
  { id: 'Management', name: 'Management' }
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
    hidingPriority: 13,
    allowEditing: false // Read-only field
  },
  {
    dataField: 'projectNumber',
    caption: 'Project No.',
    hidingPriority: 12,
    allowEditing: false // Read-only field
  },
  {
    dataField: 'areaNumber',
    caption: 'Area No.',
    hidingPriority: 11
  },
  {
    dataField: 'discipline',
    caption: 'Discipline',
    hidingPriority: 10
  },
  {
    dataField: 'documentType',
    caption: 'Document Type',
    hidingPriority: 9
  },
  {
    dataField: 'departmentId',
    caption: 'Department',
    hidingPriority: 8,
    lookup: {
      dataSource: departmentEnum,
      valueExpr: 'id',
      displayExpr: 'name'
    }
  },
  {
    dataField: 'deliverableTypeId',
    caption: 'Deliverable Type',
    hidingPriority: 1,
    lookup: {
      dataSource: deliverableTypeEnum,
      valueExpr: 'id',
      displayExpr: 'name'
    }
  },
  {
    dataField: 'internalDocumentNumber',
    caption: 'Internal Doc. No.',
    hidingPriority: 0 // Will be hidden first
  },
  {
    dataField: 'clientDocumentNumber',
    caption: 'Client Doc. No.',
    hidingPriority: 6
  },
  {
    dataField: 'documentTitle',
    caption: 'Document Title',
    hidingPriority: 2  // Will be hidden early
  },
  {
    dataField: 'budgetHours',
    caption: 'Budget Hours',
    hidingPriority: 5
  },
  {
    dataField: 'variationHours',
    caption: 'Variation Hours',
    hidingPriority: 4
  },
  {
    dataField: 'totalHours',
    caption: 'Total Hours',
    hidingPriority: 3,
    allowEditing: false // Read-only calculated field
  },
  {
    dataField: 'bookingCode',
    caption: 'Booking Code',
    hidingPriority: 7,
    allowEditing: false // Read-only calculated field
  }
];
