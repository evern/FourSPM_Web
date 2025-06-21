import type { ODataGridColumn } from '../../components';
import { departmentEnum } from '../../types/enums';

// Generic progress tracking columns configuration
export const createDeliverableProgressColumns = (deliverableGatesDataSource: any, isMobile: boolean = false): ODataGridColumn[] => {
  return [
    {
      dataField: 'bookingCode',
      caption: 'Booking Code',
      allowEditing: false,
      cellClass: 'faded-placeholder',
      hidingPriority: 0, // Hide first
      showSummary: true
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
        dataSource: departmentEnum,
        valueExpr: 'id',
        displayExpr: 'name'
      }
    },
    {
      dataField: 'internalDocumentNumber',
      caption: 'Internal Number',
      allowEditing: false,
      cellClass: 'faded-placeholder',
      hidingPriority: 20, // Hidden last - most important
      fixed: isMobile,
      fixedPosition: 'left',
      showSummary: true,
      summaryType: 'count'
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
      hidingPriority: 11 // Adjusted priority
    },
    {
      dataField: 'deliverableGateGuid',
      caption: 'Gate',
      hidingPriority: 18, // Third in sequence, after internalDocumentNumber and cumulativeEarntPercentage
      lookup: {
        dataSource: deliverableGatesDataSource,
        valueExpr: 'guid',
        displayExpr: 'name'
      },
      editorOptions: {
        allowNull: true, // Allow clearing the gate value
        showClearButton: true // Show a button to clear the selected value
      }
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
        showSpinButtons: true,
        min: 0,
        max: 1.0,
        step: 0.01,
        format: 'percent',
        valueChangeEvent: 'keyup change'
      },
      hidingPriority: 19,
      showSummary: true,
      summaryType: 'custom',
      customSummaryType: 'cumulativeEarntPercentage',
      summaryFormat: 'Total: {0}',
      
      // Group summary properties
      showGroupSummary: true,
      groupSummaryFormat: 'Group: {0}',
      alignByColumn: true,
      showInGroupFooter: true
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
      hidingPriority: 16, // Fifth in sequence
      editorOptions: {
        format: 'percent',
        step: 0.01
      },
      showSummary: true,
      summaryType: 'custom',
      customSummaryType: 'currentPeriodEarntPercentage',
      summaryFormat: 'Total: {0}',
      
      // Group summary properties
      showGroupSummary: true,
      groupSummaryFormat: 'Group: {0}',
      alignByColumn: true,
      showInGroupFooter: true
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
      hidingPriority: 17, // Fourth in sequence
      showSummary: true,
      summaryType: 'sum',
      summaryFormat: {
        precision: 2
      },
      showGroupSummary: true,
      groupSummaryFormat: 'Group: {0}',
      alignByColumn: true,
      showInGroupFooter: true
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
      hidingPriority: 14, // Seventh in sequence
      editorOptions: {
        format: 'percent',
        step: 0.01
      },
      showSummary: true,
      summaryType: 'custom',
      customSummaryType: 'totalPercentageEarnt',
      summaryFormat: 'Total: {0}',
      showGroupSummary: true,
      groupSummaryFormat: 'Group: {0}',
      alignByColumn: true,
      showInGroupFooter: true
    },
    {
      dataField: 'totalEarntHours',
      caption: 'Total Earnt Hours',
      dataType: 'number',
      allowEditing: false,
      cellClass: 'faded-placeholder',
      hidingPriority: 13,
      customizeText: (cellInfo: any) => {
        if (cellInfo.value === null || cellInfo.value === undefined) return '0.00';
        return cellInfo.value.toFixed(2);
      },
      showSummary: true,
      summaryType: 'sum',
      summaryFormat: {
        precision: 2
      },
      showGroupSummary: true,
      groupSummaryFormat: 'Group: {0}',
      alignByColumn: true,
      showInGroupFooter: true
    },
    {
      dataField: 'totalHours',
      caption: 'Total Hours',
      dataType: 'number',
      allowEditing: false,
      cellClass: 'faded-placeholder',
      hidingPriority: 12,
      customizeText: (cellInfo: any) => {
        if (cellInfo.value === null || cellInfo.value === undefined) return '0.00';
        return cellInfo.value.toFixed(2);
      },
      showSummary: true,
      summaryType: 'sum',
      summaryFormat: {
        precision: 2
      },
      showGroupSummary: true,
      groupSummaryFormat: 'Group: {0}',
      alignByColumn: true,
      showInGroupFooter: true
    },
  ];
};
