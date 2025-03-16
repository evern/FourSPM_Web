import { ODataGridColumn } from '../../components/ODataGrid/ODataGrid';

export const disciplineColumns: ODataGridColumn[] = [
  {
    dataField: 'code',
    caption: 'Code',
    hidingPriority: 2,
    editorOptions: {
      maxLength: 2
    }
  },
  {
    dataField: 'name',
    caption: 'Name',
    hidingPriority: 1,
    editorOptions: {
      maxLength: 500
    }
  },
  {
    dataField: 'created',
    caption: 'Created Date',
    hidingPriority: 0,
    allowEditing: false, // Read-only field
    cellClass: 'faded-placeholder',
    customizeText: (cellInfo: any) => {
      if (!cellInfo.value) return '';
      return new Date(cellInfo.value).toLocaleString();
    }
  }
];
