import type { ODataGridColumn } from '../../components';

export const deliverableGateColumns: ODataGridColumn[] = [
  {
    dataField: 'name',
    caption: 'Name',
    hidingPriority: 2,
    allowEditing: true,
    showSummary: true,
    summaryType: 'count'
  },
  {
    dataField: 'autoPercentage',
    caption: 'Auto Percentage',
    hidingPriority: 0,
    allowEditing: true,
    dataType: 'number', // Explicitly define the data type
    editorOptions: {
      format: '#0%',  // Format as percentage
      showSpinButtons: true,
      showClearButton: false,
      min: 0,
      max: 1, // 100% as decimal
      step: 0.01,
      value: 0 // Default value
    },
    customizeText: (cellInfo) => {
      // Always format as percentage
      const value = parseFloat(cellInfo.value) || 0;
      return `${(value * 100).toFixed(0)}%`;
    },
    tooltip: 'Auto percentage value. Cannot exceed the max percentage value.'
  },
  {
    dataField: 'maxPercentage',
    caption: 'Max Percentage',
    hidingPriority: 1,
    allowEditing: true,
    dataType: 'number', // Explicitly define the data type
    sortOrder: 'asc', // Set default sort order to ascending
    sortIndex: 0,     // Make this the primary sort column
    editorOptions: {
      format: '#0%',  // Format as percentage
      showSpinButtons: true,
      showClearButton: false,
      min: 0,
      max: 1, // 100% as decimal
      step: 0.01,
      value: 0 // Default value
    },
    customizeText: (cellInfo) => {
      // Always format as percentage
      const value = parseFloat(cellInfo.value) || 0;
      return `${(value * 100).toFixed(0)}%`;
    },
    tooltip: 'Maximum percentage value (0-100%). Auto percentage cannot exceed this value.'
  }
];
