import type { ODataGridColumn } from '../../components';

export const clientColumns: ODataGridColumn[] = [
  { 
    dataField: 'number', 
    caption: 'Client #', 
    hidingPriority: 8 
  },
  { 
    dataField: 'description', 
    caption: 'Description', 
    hidingPriority: 9 
  },
  { 
    dataField: 'clientContactName', 
    caption: 'Contact Name', 
    hidingPriority: 5 
  },
  { 
    dataField: 'clientContactNumber', 
    caption: 'Contact Phone', 
    hidingPriority: 3,
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
    hidingPriority: 4 
  },
  {
    dataField: 'created',
    caption: 'Created',
    hidingPriority: 0,
    cellClass: 'faded-placeholder',
    allowEditing: false 
  }
];
