import { ODataGridColumn } from '../../components/ODataGrid/ODataGrid';

export const clientColumns: ODataGridColumn[] = [
  { 
    dataField: 'number', 
    caption: 'Client #', 
    hidingPriority: 2 
  },
  { 
    dataField: 'description', 
    caption: 'Description', 
    hidingPriority: 8 
  },
  { 
    dataField: 'clientContactName', 
    caption: 'Contact Name', 
    hidingPriority: 5 
  },
  { 
    dataField: 'clientContactNumber', 
    caption: 'Contact Phone', 
    hidingPriority: 6,
    editorOptions: {
      mask: '(+00)-000000000',
      maskRules: {
        '0': /[0-9]/
      },
      useMaskedValue: true
    } 
  },
  { 
    dataField: 'clientContactEmail', 
    caption: 'Contact Email', 
    hidingPriority: 7 
  },
  {
    dataField: 'created',
    caption: 'Created',
    hidingPriority: 9,
    cellClass: 'faded-placeholder',
    allowEditing: false // Read-only field
  }
];
