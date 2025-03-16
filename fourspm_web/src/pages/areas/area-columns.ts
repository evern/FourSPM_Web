import { ODataGridColumn } from '../../components/ODataGrid/ODataGrid';

export const areaColumns: ODataGridColumn[] = [
  {
    dataField: 'number',
    caption: 'Area Number',
    allowEditing: true,
    editorOptions: {
      mask: '00',
      maskRules: { '0': /[0-9]/ }
    }
  },
  {
    dataField: 'description',
    caption: 'Description',
    allowEditing: true
  },
  {
    dataField: 'created',
    caption: 'Created',
    hidingPriority: 9,
    cellClass: 'faded-placeholder',
    allowEditing: false // Read-only field
  }
];
