import { ODataGridColumn } from '../../components/ODataGrid/ODataGrid';



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
    width: 120,
    allowEditing: false,
    type: 'buttons',
    buttons: [
      {
        hint: 'View Variation Deliverables',
        icon: 'doc',
        text: 'View',
        onClick: (e: any) => {
          // Navigate to the variation deliverables component
          window.location.href = `#/variations/${e.row.data.guid}/deliverables`;
        }
      }
    ]
  }
];
