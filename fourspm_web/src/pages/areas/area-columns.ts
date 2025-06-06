import type { ODataGridColumn } from '../../components';

export const areaColumns: ODataGridColumn[] = [
  {
    dataField: 'number',
    caption: 'Area Number',
    allowEditing: true,
    hidingPriority: 2, // Identifier - hide last
    editorOptions: {
      mask: '00',
      maskRules: { '0': /[0-9]/ }
    },
    showSummary: true,
    summaryType: 'count'
  },
  {
    dataField: 'description',
    caption: 'Description',
    hidingPriority: 1, // Name - hide second to last
    allowEditing: true
  },
  {
    dataField: 'created',
    caption: 'Created',
    hidingPriority: 0, // Metadata - hide first
    cellClass: 'faded-placeholder',
    allowEditing: false // Read-only field
  }
];
