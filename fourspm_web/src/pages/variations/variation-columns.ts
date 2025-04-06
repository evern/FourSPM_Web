import { ODataGridColumn } from '../../components/ODataGrid/ODataGrid';
import { renderDeliverablesButton } from './deliverables-button-renderer';



export const variationColumns: ODataGridColumn[] = [
  {
    dataField: 'name',
    caption: 'Name',
    allowEditing: true,
    hidingPriority: 3 // Keep visible even on smaller screens
  },
  {
    dataField: 'comments',
    caption: 'Comments',
    allowEditing: true,
    hidingPriority: 2
  },
  {
    dataField: 'submitted',
    caption: 'Submitted',
    allowEditing: true,
    hidingPriority: 1,
    dataType: 'date'
  },
  {
    dataField: 'clientApproved',
    caption: 'Client Approved',
    allowEditing: true,
    hidingPriority: 1,
    dataType: 'date'
  },
  {
    dataField: 'created',
    caption: 'Created',
    hidingPriority: 0, // Metadata - hide first
    cellClass: 'faded-placeholder',
    allowEditing: false, // Read-only field
    visible: false
  },
  {
    dataField: 'guid',
    caption: 'Deliverables',
    width: 150,
    allowEditing: false,
    cellRender: renderDeliverablesButton
  }
];
