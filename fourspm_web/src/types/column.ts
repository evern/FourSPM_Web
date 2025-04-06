import { Column } from 'devextreme/ui/data_grid';
import { dxDataGridColumn } from 'devextreme/ui/data_grid';

/**
 * Extended column interface with additional properties specific to ODataGrid
 */
export interface ODataGridColumn extends Partial<dxDataGridColumn<any, any>> {
  // Standard DevExtreme column properties
  dataField?: string;
  caption?: string;
  dataType?: 'string' | 'number' | 'boolean' | 'object' | 'date' | 'datetime';
  visible?: boolean;
  width?: number | string;
  alignment?: 'left' | 'center' | 'right';
  
  // Extended properties for ODataGrid
  allowSorting?: boolean;
  sortIndex?: number;
  sortOrder?: 'asc' | 'desc';
  cellTemplate?: (container: any, options: any) => void;
  headerCellTemplate?: (container: any, options: any) => void;
  calculateCellValue?: (rowData: any) => any;
  customizeText?: (cellInfo: any) => string;
  buttons?: Array<any>;
  customType?: string; // Custom property for our internal use
  cellClass?: string;
  showSummary?: boolean;
  summaryType?: string;
  summaryFormat?: any;
}
