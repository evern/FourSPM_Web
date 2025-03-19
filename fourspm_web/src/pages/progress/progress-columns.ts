import { ODataGridColumn } from '../../components/ODataGrid/ODataGrid';
import { DepartmentEnum } from '../../types/enums';

export const PROGRESS_GATES = [
  { id: 1, name: 'Started', autoPercent: 10, maxPercent: 49 },
  { id: 2, name: 'Issued for Checking', autoPercent: 50, maxPercent: 69 },
  { id: 3, name: 'Issued for Client Review', autoPercent: 70, maxPercent: 99 },
  { id: 4, name: 'Issued for Construction/Use', autoPercent: 100, maxPercent: 100 }
] as const;

export const progressColumns: ODataGridColumn[] = [
  {
    dataField: 'bookingCode',
    caption: 'Booking Code',
    allowEditing: false,
  },
  {
    dataField: 'areaNumber',
    caption: 'Area Code',
    allowEditing: false,
  },
  {
    dataField: 'discipline',
    caption: 'Discipline',
    allowEditing: false,
  },
  {
    dataField: 'documentType',
    caption: 'Document Type',
    allowEditing: false,
  },
  {
    dataField: 'departmentId',
    caption: 'Department',
    allowEditing: false,
    lookup: {
      dataSource: Object.entries(DepartmentEnum)
        .filter(([key]) => !isNaN(Number(key)))
        .map(([value, text]) => ({ value: Number(value), text })),
      valueExpr: 'value',
      displayExpr: 'text'
    }
  },
  {
    dataField: 'internalDocumentNumber',
    caption: 'Internal Number',
    allowEditing: false,
  },
  {
    dataField: 'clientDocumentNumber',
    caption: 'Client Number',
    allowEditing: false,
  },
  {
    dataField: 'documentTitle',
    caption: 'Document Title',
    allowEditing: false,
  },
  {
    dataField: 'gateId',
    caption: 'Gate',
    lookup: {
      dataSource: PROGRESS_GATES,
      valueExpr: 'id',
      displayExpr: 'name'
    },
  },
  {
    dataField: 'totalPercentageEarnt',
    caption: 'Total % Earnt',
    dataType: 'number',
    customizeText: (cellInfo: any) => {
      if (cellInfo.value === null || cellInfo.value === undefined) return '0.00%';
      return (cellInfo.value * 100).toFixed(2) + '%';
    },
    allowEditing: true,
    editorOptions: {
      min: 0,
      max: 1.0, // Backend stores as decimal (0-1)
      step: 0.05, // 5% increments
      format: {
        type: 'percent',
        precision: 2
      }
    },
  },
  {
    dataField: 'totalEarntHours',
    caption: 'Total Earnt Hours',
    dataType: 'number',
    allowEditing: false,
    customizeText: (cellInfo: any) => {
      if (cellInfo.value === null || cellInfo.value === undefined) return '0.00';
      return cellInfo.value.toFixed(2);
    }
  },
  {
    dataField: 'periodPercentageEarnt',
    caption: 'Period % Earnt',
    dataType: 'number',
    customizeText: (cellInfo: any) => {
      if (cellInfo.value === null || cellInfo.value === undefined) return '0.00%';
      return (cellInfo.value * 100).toFixed(2) + '%';
    },
    allowEditing: false,
  },
  {
    dataField: 'periodEarntHours',
    caption: 'Period Earnt Hours',
    dataType: 'number',
    allowEditing: false,
    customizeText: (cellInfo: any) => {
      if (cellInfo.value === null || cellInfo.value === undefined) return '0.00';
      return cellInfo.value.toFixed(2);
    }
  },
  {
    dataField: 'totalHours', 
    caption: 'Total Hours',
    dataType: 'number',
    allowEditing: false,
    customizeText: (cellInfo: any) => {
      if (cellInfo.value === null || cellInfo.value === undefined) return '0.00';
      return cellInfo.value.toFixed(2);
    }
  },
];
