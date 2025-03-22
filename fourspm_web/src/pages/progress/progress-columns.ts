import { ODataGridColumn } from '../../components/ODataGrid/ODataGrid';
import { DepartmentEnum } from '../../types/enums';
import { deliverableGatesStore } from '../../stores/odataStores';

// Generic progress tracking columns configuration
export const createProgressColumns = (): ODataGridColumn[] => {
  return [
    {
      dataField: 'bookingCode',
      caption: 'Booking Code',
      allowEditing: false,
      cellClass: 'faded-placeholder',
      hidingPriority: 0 // Hide first
    },
    {
      dataField: 'areaNumber',
      caption: 'Area Code',
      allowEditing: false,
      cellClass: 'faded-placeholder',
      hidingPriority: 6
    },
    {
      dataField: 'discipline',
      caption: 'Discipline',
      allowEditing: false,
      cellClass: 'faded-placeholder',
      hidingPriority: 5
    },
    {
      dataField: 'documentType',
      caption: 'Document Type',
      allowEditing: false,
      cellClass: 'faded-placeholder',
      hidingPriority: 4
    },
    {
      dataField: 'departmentId',
      caption: 'Department',
      allowEditing: false,
      cellClass: 'faded-placeholder',
      hidingPriority: 3,
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
      cellClass: 'faded-placeholder',
      hidingPriority: 20 // Hidden last - most important
    },
    {
      dataField: 'clientDocumentNumber',
      caption: 'Client Number',
      allowEditing: false,
      cellClass: 'faded-placeholder',
      hidingPriority: 10 
    },
    {
      dataField: 'documentTitle',
      caption: 'Document Title',
      allowEditing: false,
      cellClass: 'faded-placeholder',
      hidingPriority: 1 // Very important, hide near last
    },
    {
      dataField: 'deliverableGateGuid',
      caption: 'Gate',
      hidingPriority: 18, // Third to last to hide
      lookup: {
        dataSource: deliverableGatesStore,
        valueExpr: 'guid',
        displayExpr: (item: any) => item ? `${item.name}` : ''
      },
    },
    // Progress percentage column - user edits the cumulative percentage earned up to the current period
    {
      dataField: 'cumulativeEarntPercentage',
      caption: 'Cumulative % Earnt',
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
      hidingPriority: 17, // Fourth to last to hide
    },
    // Current period percentage
    {
      dataField: 'currentPeriodEarntPercentage',
      caption: 'Current Period % Earnt',
      dataType: 'number',
      customizeText: (cellInfo: any) => {
        if (cellInfo.value === null || cellInfo.value === undefined) return '0.00%';
        return (cellInfo.value * 100).toFixed(2) + '%';
      },
      allowEditing: false,
      cellClass: 'faded-placeholder',
      hidingPriority: 18, // Third to last to hide
    },
    // Period earned hours
    {
      dataField: 'currentPeriodEarntHours',
      caption: 'Current Period Earnt Hours',
      dataType: 'number',
      customizeText: (cellInfo: any) => {
        if (cellInfo.value === null || cellInfo.value === undefined) return '0.00';
        return cellInfo.value.toFixed(2);
      },
      allowEditing: false,
      cellClass: 'faded-placeholder',
      hidingPriority: 16, // Fifth to last to hide
    },
    {
      dataField: 'totalPercentageEarnt',
      caption: 'Total % Earnt',
      dataType: 'number',
      customizeText: (cellInfo: any) => {
        if (cellInfo.value === null || cellInfo.value === undefined) return '0.00%';
        return (cellInfo.value * 100).toFixed(2) + '%';
      },
      allowEditing: false,
      cellClass: 'faded-placeholder',
      hidingPriority: 19, // Second to last to hide
    },
    {
      dataField: 'totalEarntHours',
      caption: 'Total Earnt Hours',
      dataType: 'number',
      allowEditing: false,
      cellClass: 'faded-placeholder',
      hidingPriority: 15, // Sixth to last to hide
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
      cellClass: 'faded-placeholder',
      hidingPriority: 13,
      customizeText: (cellInfo: any) => {
        if (cellInfo.value === null || cellInfo.value === undefined) return '0.00';
        return cellInfo.value.toFixed(2);
      }
    },
  ];
};
