import { ODataGridColumn } from '../../types/column';
import { departmentEnum, deliverableTypeEnum } from '../../types/enums';
import { Area, Discipline, DocumentType } from '../../types/odata-types';
import 'devextreme/ui/html_editor';

/**
 * Creates column definitions for variation deliverable grid
 * Follows the Collection View Doctrine pattern
 */
export const createVariationDeliverableColumns = (
  areasDataSource: any,
  disciplinesDataSource: any,
  documentTypesDataSource: any,
  isMobile: boolean = false,
  onCancellationClick?: (data: any, isReadOnly?: boolean) => void,
  isReadOnly: boolean = false
): ODataGridColumn[] => {
  return [
    {
      dataField: 'uiStatus_statusButtons', // Make the dataField unique by incorporating the button name
      caption: 'Status',
      width: 80, // More compact width
      allowEditing: false,
      hidingPriority: 15, // Show as long as possible
      fixed: true,
      fixedPosition: 'left',
      allowSorting: true,
      // Use command column pattern but with disabled buttons for status display
      type: 'buttons',
      name: 'statusButtons', // Unique name for this buttons column
      buttons: [
        // Original status indicator
        {
          text: 'Original',
          hint: 'Original Deliverable',
          icon: 'doc',
          visible: (e: any) => e.row.data.uiStatus === 'Original'
        },
        // Add status indicator
        {
          text: 'Add',
          hint: 'Added Deliverable',
          icon: 'plus',
          visible: (e) => e.row.data.uiStatus === 'Add'
        },
        // Edit status indicator
        {
          text: 'Edit',
          hint: 'Edited Deliverable', 
          icon: 'edit',
          visible: (e) => e.row.data.uiStatus === 'Edit'
        },
        // Cancel status indicator
        {
          text: 'Cancel',
          hint: 'Cancelled Deliverable',
          icon: 'remove',
          visible: (e) => e.row.data.uiStatus === 'Cancel'
        }
      ]
    },
    {
      dataField: 'clientNumber',
      caption: 'Client No.',
      hidingPriority: 3, // Mid-range priority
      allowEditing: false, // Read-only field
      cellClass: 'faded-placeholder'
    },
    {
      dataField: 'projectNumber',
      caption: 'Project No.',
      hidingPriority: 4, // Mid-range priority
      allowEditing: false, // Read-only field
      cellClass: 'faded-placeholder'
    },
    {
      dataField: 'areaNumber',
      caption: 'Area No.',
      hidingPriority: 5, // Mid-range priority
      lookup: {
        dataSource: areasDataSource,
        valueExpr: 'number',
        displayExpr: item => item ? `${item.number} - ${item.description}` : ''
      }
    },
    {
      dataField: 'departmentId',
      caption: 'Department',
      hidingPriority: 8,
      lookup: {
        dataSource: departmentEnum,
        valueExpr: 'id',
        displayExpr: 'name'
      }
    },
    {
      dataField: 'discipline',
      caption: 'Discipline',
      hidingPriority: 7,
      lookup: {
        dataSource: disciplinesDataSource,
        valueExpr: 'code',
        displayExpr: 'code'
      }
    },
    {
      dataField: 'deliverableTypeId',
      caption: 'Deliverable Type',
      hidingPriority: 9,
      lookup: {
        dataSource: deliverableTypeEnum,
        valueExpr: 'id',
        displayExpr: 'name'
      }
    },
    {
      dataField: 'documentType',
      caption: 'Document Type',
      hidingPriority: 6,
      lookup: {
        dataSource: documentTypesDataSource,
        valueExpr: 'code',
        displayExpr: 'code'
      }
    },
    {
      dataField: 'internalDocumentNumber',
      caption: 'Internal Number',
      hidingPriority: 14, // Will be hidden last (highest number = shown longest)
      allowEditing: false, // Read-only for variation deliverables
      fixed: isMobile, // Conditionally apply fixed positioning on mobile only
      fixedPosition: 'left',
      showSummary: true,
      summaryType: 'count'
    },
    {
      dataField: 'clientDocumentNumber',
      caption: 'Client Number',
      hidingPriority: 13
    },
    {
      dataField: 'documentTitle',
      caption: 'Document Title',
      hidingPriority: 12, // Hide after metadata but before identifiers
      // Allow editing to support modifications to deliverable title in variations
    },
    {
      dataField: 'budgetHours',
      caption: 'Budget Hours',
      hidingPriority: 11,
      dataType: 'number',
      allowEditing: false, // Read-only as this shows the original deliverable hours
      cellClass: 'faded-placeholder'
    },
    {
      dataField: 'variationHours',
      caption: 'Variation Hours',
      hidingPriority: 10,
      dataType: 'number',
      editorOptions: {
        type: 'number',
        min: 0,
        showSpinButtons: true,
        showClearButton: false,
        step: 1
      },
      showSummary: true,
      summaryType: 'sum'
    },
    {
      dataField: 'variationName',
      caption: 'From Variation',
      hidingPriority: 12,
      allowEditing: false,
      cellClass: 'faded-placeholder',
      calculateCellValue: (rowData: any) => rowData.variationName
    },
    {
      dataField: 'totalHours',
      caption: 'Total Hours',
      hidingPriority: 2,
      allowEditing: false, // Read-only calculated field
      cellClass: 'faded-placeholder',
      dataType: 'number',
      showSummary: true,
      summaryType: 'sum'
    },
    {
      dataField: 'totalCost',
      caption: 'Total Cost',
      hidingPriority: 3,
      allowEditing: false,
      cellClass: 'faded-placeholder',
      dataType: 'number',
      customizeText: (cellInfo: any) => {
        return cellInfo.value ? `$${cellInfo.value.toFixed(2)}` : '$0.00';
      },
      showSummary: true,
      summaryType: 'sum',
      summaryFormat: {
        type: 'currency',
        precision: 2,
        currency: 'AUD'
      }
    },
    {
      dataField: 'bookingCode',
      caption: 'Booking Code',
      hidingPriority: 1, // Will be shown as long as possible
      allowEditing: false, // Read-only calculated field
      cellClass: 'faded-placeholder'
    },
    // Use DevExtreme command column for better performance
    {
      type: 'buttons',
      dataField: 'guid_actionButtons', // Make the dataField unique by incorporating the button name
      name: 'actionButtons', // Unique name for this buttons column
      caption: 'Actions',
      width: 80, // More compact width
      fixed: true,
      fixedPosition: 'right',
      allowEditing: false,
      hidingPriority: 15, // Show as long as possible
      // Define multiple buttons for different statuses
      buttons: [
        // Button for Add status
        {
          hint: 'Remove Added Deliverable',
          icon: 'deleterow',
          visible: (e) => e.row.data.uiStatus === 'Add',
          onClick: (e) => onCancellationClick?.(e, isReadOnly)
        },
        // Button for Edit status
        {
          hint: 'Cancel Edited Deliverable', 
          icon: 'revert',
          visible: (e) => e.row.data.uiStatus === 'Edit',
          onClick: (e) => onCancellationClick?.(e, isReadOnly)
        },
        // Button for Original status
        {
          hint: 'Cancel Original Deliverable',
          icon: 'clear',
          visible: (e) => e.row.data.uiStatus === 'Original',
          onClick: (e) => onCancellationClick?.(e, isReadOnly)
        },
        // Button for Cancelled status - to un-cancel a deliverable
        {
          hint: 'Un-cancel Deliverable',
          icon: 'undo',
          visible: (e) => e.row.data.variationStatus === 'UnapprovedCancellation',
          onClick: (e) => onCancellationClick?.(e, isReadOnly) // Need to create this handler
        }
      ]
    }
  ];
};

/**
 * Ensures all columns have a dataField property for ODataGrid compatibility
 * @param baseColumns The original columns array
 * @returns Processed columns with guaranteed dataField properties
 */
export const processVariationDeliverableColumns = (baseColumns: ODataGridColumn[]): ODataGridColumn[] => {
  return baseColumns.map(col => {
    // If column has no dataField but has 'type' (like button columns), use a unique dataField based on name
    if (!col.dataField && col.type === 'buttons') {
      // Use the button column's name as part of the dataField if available
      // This ensures each button column gets a unique dataField
      return { ...col, dataField: col.name ? `buttons_${col.name}` : 'guid' };
    }
    return col;
  });
};
