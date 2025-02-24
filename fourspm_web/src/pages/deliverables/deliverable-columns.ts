import { ODataGridColumn } from '../../components/ODataGrid/ODataGrid';
import { API_CONFIG } from '../../config/api';
import ODataStore from 'devextreme/data/odata/store';

const departmentStore = new ODataStore({
  url: `${API_CONFIG.baseUrl}/odata/v1/Departments`,
  version: 4,
  key: 'id',
  keyType: 'Guid'
});

const deliverableTypeStore = new ODataStore({
  url: `${API_CONFIG.baseUrl}/odata/v1/DeliverableTypes`,
  version: 4,
  key: 'id',
  keyType: 'Guid'
});

export const deliverableColumns: ODataGridColumn[] = [
  {
    dataField: 'clientNumber',
    caption: 'Client No.'
  },
  {
    dataField: 'projectNumber',
    caption: 'Project No.'
  },
  {
    dataField: 'areaNumber',
    caption: 'Area No.'
  },
  {
    dataField: 'discipline',
    caption: 'Discipline'
  },
  {
    dataField: 'documentType',
    caption: 'Document Type'
  },
  {
    dataField: 'departmentId',
    caption: 'Department',
    lookup: {
      dataSource: departmentStore,
      valueExpr: 'id',
      displayExpr: 'name'
    }
  },
  {
    dataField: 'deliverableTypeId',
    caption: 'Deliverable Type',
    lookup: {
      dataSource: deliverableTypeStore,
      valueExpr: 'id',
      displayExpr: 'name'
    }
  },
  {
    dataField: 'internalDocumentNumber',
    caption: 'Internal Doc. No.'
  },
  {
    dataField: 'clientDocumentNumber',
    caption: 'Client Doc. No.'
  },
  {
    dataField: 'documentTitle',
    caption: 'Document Title'
  },
  {
    dataField: 'budgetHours',
    caption: 'Budget Hours'
  },
  {
    dataField: 'variationHours',
    caption: 'Variation Hours'
  },
  {
    dataField: 'totalHours',
    caption: 'Total Hours'
  },
  {
    dataField: 'totalCost',
    caption: 'Total Cost'
  },
  {
    dataField: 'bookingCode',
    caption: 'Booking Code'
  }
];
