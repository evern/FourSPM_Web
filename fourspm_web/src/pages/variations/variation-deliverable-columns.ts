import { ODataGridColumn } from '../../types/column';
import { departmentEnum, deliverableTypeEnum, variationStatusEnum } from '../../types/enums';
import { Area, Discipline, DocumentType } from '../../types/odata-types';
import { VariationDeliverableUiStatus } from '../../types/app-types';
import 'devextreme/ui/html_editor';
import { renderCancellationButton } from './cancellation-button-renderer';
import { renderStatusIndicator } from './status-indicator-renderer';

/**
 * Creates column definitions for variation deliverable grid
 * Follows the Collection View Doctrine pattern
 */
export const createVariationDeliverableColumns = (
  areasDataSource: any,
  disciplinesDataSource: any,
  documentTypesDataSource: any,
  isMobile: boolean = false,
  onCancellationClick?: (data: any) => void
): ODataGridColumn[] => {
  return [
    {
      dataField: 'uiStatus',
      caption: 'Status',
      width: 110,
      allowEditing: false,
      hidingPriority: 15, // Show as long as possible
      fixed: true,
      fixedPosition: 'left',
      allowSorting: true,
      // Use cellRender with our React component for better reliability
      cellRender: renderStatusIndicator
    } as any, // Type assertion to bypass TypeScript constraint
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
      caption: 'Internal Doc. No.',
      hidingPriority: 14, // Will be hidden last (highest number = shown longest)
      allowEditing: false, // Read-only for variation deliverables
      fixed: isMobile, // Conditionally apply fixed positioning on mobile only
      fixedPosition: 'left'
    },
    {
      dataField: 'clientDocumentNumber',
      caption: 'Client Doc. No.',
      hidingPriority: 13, // Near last
      allowEditing: false // Read-only for variation deliverables
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
      dataType: 'number',
      allowEditing: false, // Read-only for variations
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
    // Use same pattern as in variation-columns.ts
    {
      dataField: 'guid',
      caption: 'Actions',
      width: 80,
      fixed: true,
      fixedPosition: 'right',
      allowEditing: false,
      hidingPriority: 15, // Show as long as possible
      cellRender: (cellData: any) => renderCancellationButton(cellData, onCancellationClick || (() => {}))
    } as any // Type assertion to bypass TypeScript constraint
  ];
};

/**
 * Ensures all columns have a dataField property for ODataGrid compatibility
 * @param baseColumns The original columns array
 * @returns Processed columns with guaranteed dataField properties
 */
export const processVariationDeliverableColumns = (baseColumns: ODataGridColumn[]): ODataGridColumn[] => {
  return baseColumns.map(col => {
    // If column has no dataField but has 'type' (like button columns), use 'guid' as dataField
    if (!col.dataField && col.type === 'buttons') {
      return { ...col, dataField: 'guid' };
    }
    return col;
  });
};
