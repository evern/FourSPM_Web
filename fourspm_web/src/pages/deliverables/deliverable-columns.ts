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
      hidingPriority: 3,
      allowEditing: false, // Read-only field
      cellClass: 'faded-placeholder'
    },
    {
      dataField: 'projectNumber',
      caption: 'Project No.',
      hidingPriority: 4,
      allowEditing: false, // Read-only field
      cellClass: 'faded-placeholder'
    },
    {
      dataField: 'areaNumber',
      caption: 'Area No.',
      hidingPriority: 5,
      lookup: {
        dataSource: areasDataSource, // Use the DataSource with filter
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
      hidingPriority: 6,
      lookup: {
        dataSource: disciplinesDataSource, // Use the DataSource
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
      },
      editorOptions: {
        placeholder: 'Select type...',
        showClearButton: false,
        onInitialized: (e: any) => {
          // Make sure the editor always displays a value
          if (e.component && e.component.option) {
            const value = e.component.option('value');
            if (value === null || value === undefined) {
              // Set the default value to 'Task'
              e.component.option('value', 'Task');
            }
          }
        }
      }
    },
    {
      dataField: 'documentType',
      caption: 'Document Type',
      hidingPriority: 7,
      lookup: {
        dataSource: documentTypesDataSource, // Use the DataSource
        valueExpr: 'code',
        displayExpr: 'code'
      }
    },
    {
      dataField: 'internalDocumentNumber',
      caption: 'Internal Doc. No.',
      hidingPriority: 14 // Will be hidden last (identifier)
    },
    {
      dataField: 'clientDocumentNumber',
      caption: 'Client Doc. No.',
      hidingPriority: 13 // Near last (identifier)
    },
    {
      dataField: 'documentTitle',
      caption: 'Document Title',
      hidingPriority: 12  // Will be hidden after metadata but before identifiers (name)
    },
    {
      dataField: 'budgetHours',
      caption: 'Budget Hours',
      hidingPriority: 8,
      dataType: 'number',
      editorOptions: {
        type: 'number',
        min: 0,
        showSpinButtons: true,
        showClearButton: false,
        step: 1
      }
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
      }
    },
    {
      dataField: 'totalHours',
      caption: 'Total Hours',
      hidingPriority: 10,
      allowEditing: false, // Read-only calculated field
      cellClass: 'faded-placeholder'
    },
    {
      dataField: 'bookingCode',
      caption: 'Booking Code',
      hidingPriority: 11, // Higher hiding priority (identifier, but not the main one)
      allowEditing: false, // Read-only calculated field
      cellClass: 'faded-placeholder'
    }
  ];
};
