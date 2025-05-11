import type { ODataGridColumn } from '../../components';

export const disciplineColumns: ODataGridColumn[] = [
  {
    dataField: 'code',
    caption: 'Code',
    hidingPriority: 2, // Identifier - hide last
    editorOptions: {
      maxLength: 2
    }
  },
  {
    dataField: 'name',
    caption: 'Name',
    hidingPriority: 1, // Name - hide second to last
    editorOptions: {
      maxLength: 500
    }
  },
  {
    dataField: 'created',
    caption: 'Created Date',
    hidingPriority: 0, // Metadata - hide first
    allowEditing: false, // Read-only field
    cellClass: 'faded-placeholder'
  }
];
