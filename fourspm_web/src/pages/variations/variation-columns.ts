import type { ODataGridColumn } from '../../components';

// Define the configuration type for variation columns
type VariationColumnsConfig = {
  handleApproveVariation: (variationGuid: string, variation?: any) => Promise<boolean>;
  handleRejectVariation: (variationGuid: string) => Promise<boolean>;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
};

// Convert variationColumns to a function that takes configuration
export const variationColumns = (config: VariationColumnsConfig): ODataGridColumn[] => [
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
    dataType: 'date',
    editorOptions: {
      allowNull: true,
      showClearButton: true,
      useMaskBehavior: true
    }
  },
  {
    dataField: 'clientApproved',
    caption: 'Client Approved',
    allowEditing: false, // Read-only field - client approval requires the approval process
    cellClass: 'faded-placeholder',
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
        visible: (e) => !e.row.isNewRow && e.row.data.guid,
        onClick: (e: any) => {
          // Navigate to the variation deliverables component
          window.location.href = `#/variations/${e.row.data.guid}/deliverables`;
        }
      }
    ]
  },
  {
    type: 'buttons',
    dataField: 'guid_clientActions', // Make the dataField unique by incorporating the button name
    name: 'clientActions', // Unique name for this buttons column
    caption: 'Client Action',
    width: 120,
    fixed: true,
    fixedPosition: 'right',
    allowEditing: false,
    hidingPriority: 3, // Show as long as possible
    // Define buttons for different states
    buttons: [
      // Approve button - only visible when not approved yet
      {
        hint: 'Approve Variation',
        icon: 'check',
        text: 'Approve',
        visible: (e) => !e.row.data.clientApproved && !e.row.isNewRow && e.row.data.guid,
        onClick: async (e) => {
          // Call the approve variation handler from the config
          const success = await config.handleApproveVariation(e.row.data.guid, e.row.data);
          
          // Refresh the grid if operation was successful
          if (success) {
            e.component.refresh();
          }
        }
      },
      // Reject button - only visible when already approved
      {
        hint: 'Reject Variation',
        icon: 'close',
        text: 'Reject',
        visible: (e) => !!e.row.data.clientApproved && !e.row.isNewRow && e.row.data.guid,
        onClick: async (e) => {
          // Call the reject variation handler from the config
          const success = await config.handleRejectVariation(e.row.data.guid);
          
          // Refresh the grid if operation was successful
          if (success) {
            e.component.refresh();
          }
        }
      }
    ]
  },
  {
    type: 'buttons',
    width: 50,
    caption: ' ',
    buttons: [
      {
        hint: 'Delete Variation',
        icon: 'trash',
        visible: (e) => !e.row.isNewRow && e.row.data.guid,
        onClick: (e: any) => {
          e.component.deleteRow(e.row.rowIndex);
        }
      }
    ]
  }
];
