import { ODataGridColumn } from '../../components/ODataGrid/ODataGrid';
import { departmentEnum, deliverableTypeEnum } from '../../types/enums';
import { Area, Discipline, DocumentType } from '../../types/odata-types';

// Create columns with DataSource objects passed in for lookups
export const createDeliverableColumns = (
  areasDataSource: any,
  disciplinesDataSource: any,
  documentTypesDataSource: any
): ODataGridColumn[] => {
  return [
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
        dataSource: areasDataSource, // Use the DataSource with filter
        valueExpr: 'number',
        displayExpr: item => item ? `${item.number} - ${item.description}` : ''
      }
    },
    {
      dataField: 'departmentId',
      caption: 'Department',
      hidingPriority: 8, // Will be hidden earlier
      lookup: {
        dataSource: departmentEnum,
        valueExpr: 'id',
        displayExpr: 'name'
      }
    },
    {
      dataField: 'discipline',
      caption: 'Discipline',
      hidingPriority: 7, // Will be hidden earlier
      lookup: {
        dataSource: disciplinesDataSource, // Use the DataSource
        valueExpr: 'code',
        displayExpr: 'code'
      }
    },
    {
      dataField: 'deliverableTypeId',
      caption: 'Deliverable Type',
      hidingPriority: 9, // Will be hidden earlier
      lookup: {
        dataSource: deliverableTypeEnum,
        valueExpr: 'id',
        displayExpr: 'name'
      }
    },
    {
      dataField: 'documentType',
      caption: 'Document Type',
      hidingPriority: 6, // Will be hidden earlier
      lookup: {
        dataSource: documentTypesDataSource, // Use the DataSource
        valueExpr: 'code',
        displayExpr: 'code'
      }
    },
    {
      dataField: 'internalDocumentNumber',
      caption: 'Internal Doc. No.',
      hidingPriority: 14 // Will be hidden last (highest number = shown longest)
    },
    {
      dataField: 'clientDocumentNumber',
      caption: 'Client Doc. No.',
      hidingPriority: 13, // Near last
    },
    {
      dataField: 'documentTitle',
      caption: 'Document Title',
      hidingPriority: 12, // Hide after metadata but before identifiers
    },
    {
      dataField: 'budgetHours',
      caption: 'Budget Hours',
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
      dataField: 'variationHours',
      caption: 'Variation Hours',
      hidingPriority: 9,
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
      hidingPriority: 2, // Change from 13 to ensure it's hidden earlier
      allowEditing: false, // Read-only calculated field
      cellClass: 'faded-placeholder',
      dataType: 'number',
      showSummary: true,
      summaryType: 'sum'
    },
    {
      dataField: 'totalCost',
      caption: 'Total Cost',
      hidingPriority: 2,
      dataType: 'number',
      editorOptions: {
        type: 'number',
        min: 0,
        showSpinButtons: true,
        showClearButton: false,
        step: 1
      },
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
      hidingPriority: 1, // Change from 14 to ensure it's hidden earlier
      allowEditing: false, // Read-only calculated field
      cellClass: 'faded-placeholder'
    }
  ];
};
