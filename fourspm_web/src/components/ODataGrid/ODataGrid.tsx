import React, { useRef, useEffect, useCallback } from 'react';
import { Properties } from 'devextreme/ui/data_grid';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { exportDataGrid } from 'devextreme/pdf_exporter';
import DataGrid, {
  Column,
  Paging,
  Pager,
  FilterRow,
  Lookup,
  Sorting,
  Summary,
  TotalItem,
  Grouping,
  GroupPanel,
  Toolbar,
  Item
} from 'devextreme-react/data-grid';
import ODataStore from 'devextreme/data/odata/store';
import DataSource, { Options } from 'devextreme/data/data_source';
import notify from 'devextreme/ui/notify';
import { useScreenSizeClass } from '../../utils/media-query';
import { getToken } from '../../utils/token-store';
import { useApiErrorHandler } from '../../hooks/utils/useApiErrorHandler';
import ajax from 'devextreme/core/utils/ajax';

export interface ODataGridColumn extends Partial<Column> {

  dataField?: string;
  caption: string;
  width?: number;
  minWidth?: number;
  hidingPriority?: number;
  allowEditing?: boolean;
  dataType?: string;
  sortOrder?: 'asc' | 'desc';
  sortIndex?: number;
  groupIndex?: number;
  fixed?: boolean;
  fixedPosition?: 'left' | 'right';
  name?: string;
  editorOptions?: {
    mask?: string;
    maskRules?: Record<string, RegExp>;
    useMaskedValue?: boolean;
    [key: string]: any;
  };
  customizeText?: (cellInfo: any) => string;
  cellRender?: (cellData: any) => React.ReactNode;
  calculateDisplayValue?: string;
  cellClass?: string;
  lookup?: {
    dataSource: any | { store: ODataStore };
    valueExpr: string;
    displayExpr: string | ((item: any) => string);
  };
  tooltip?: string;
  hint?: string;
  visible?: boolean;
  showSummary?: boolean;
  summaryType?: 'sum' | 'avg' | 'min' | 'max' | 'count';
  summaryFormat?: string | object;
  

  type?: 'buttons' | 'detailExpand' | 'selection';
  buttons?: Array<{
    name?: string;
    hint?: string;
    icon?: string;
    text?: string;
    visible?: boolean | ((e: any) => boolean);
    disabled?: boolean | ((e: any) => boolean);
    onClick?: (e: any) => void;
  }>;
  cellTemplate?: (container: any, options: any) => void;
}

interface ODataGridProps {
  title: string;
  exportFileName?: string;
  endpoint?: string;
  dataSource?: any;
  columns: ODataGridColumn[];
  keyField: string;
  defaultPageSize?: number;
  allowAdding?: boolean;
  allowUpdating?: boolean;
  allowDeleting?: boolean;
  allowExporting?: boolean;
  exportConfig?: {
    allowExportSelectedData?: boolean;
    fileName?: string;
    texts?: {
      exportAll?: string;
      exportSelectedRows?: string;
      exportTo?: string;
    }
  };
  onRowUpdating?: (e: any) => void;
  onRowInserting?: Properties['onRowInserting'];
  onRowRemoving?: Properties['onRowRemoving'];
  onInitNewRow?: Properties['onInitNewRow'];
  onRowValidating?: Properties['onRowValidating'];
  onEditorPreparing?: (e: any) => void;
  onInitialized?: (e: any) => void;
  onSaving?: (e: any) => void;
  defaultFilter?: [string, string, any][];
  defaultSort?: { selector: string; desc: boolean }[];
  expand?: string[];
  showRecordCount?: boolean;
  countColumn?: string;
  customGridHeight?: string | number;
  loading?: boolean;
  storeOptions?: any;

  allowGrouping?: boolean;
  showGroupPanel?: boolean;
  autoExpandAll?: boolean;

}

export const ODataGrid: React.FC<ODataGridProps> = ({
  title,
  exportFileName,
  endpoint,
  dataSource: customDataSource,
  columns,
  keyField,
  defaultPageSize = 10,
  allowAdding = true,
  allowUpdating = true,
  allowDeleting = true,
  allowExporting = true,
  exportConfig,
  onRowUpdating,
  onRowInserting,
  onRowRemoving,
  onInitNewRow,
  onRowValidating,
  onEditorPreparing,
  onInitialized,
  onSaving: onSavingProp,
  defaultFilter = [],
  defaultSort,
  expand,
  showRecordCount = true,
  countColumn,
  customGridHeight,
  loading = false,
  storeOptions = {},

  allowGrouping = false,
  showGroupPanel = false,
  autoExpandAll = true,
}) => {
  const dataGridRef = useRef<DataGrid>(null);
  const screenSizeClass = useScreenSizeClass();
  const { handleApiError } = useApiErrorHandler();
  
  // Configure DevExtreme global error handling - disable default error display
  useEffect(() => {
    // Set up global AJAX error handler
    const originalOnAjaxError = ajax.onAjaxError;
    ajax.onAjaxError = (xhr) => {
      try {
        // Extract error details from the response
        let errorDetails = 'Unknown error';
        let errorMessage = '';
        
        if (xhr.responseText) {
          try {
            const response = JSON.parse(xhr.responseText);
            errorDetails = response;
            errorMessage = response.message || response.error || response.Message || '';
          } catch (e) {
            errorDetails = xhr.responseText;
          }
        }
        
        // Create an error object with the extracted details
        const error = {
          httpStatus: xhr.status,
          errorDetails: errorDetails,
          message: errorMessage
        };
        
        // Use our custom error handler
        handleApiError(error, {
          403: 'You do not have permission to perform this operation.'
        });
        
        // Return true to prevent default error handling
        return true;
      } catch (e) {
        console.error('Error in onAjaxError handler:', e);
        return false; // Let DevExtreme handle it if our handler fails
      }
    };
    
    // Cleanup when component unmounts
    return () => {
      ajax.onAjaxError = originalOnAjaxError;
    };
  }, [handleApiError]);
  

  const getCurrentToken = () => getToken();
  
  // No need to track token changes - getToken() will always return the latest

  let dataSourceInstance;

  // Use the provided custom dataSource if available, otherwise create one from the endpoint
  if (customDataSource) {
    dataSourceInstance = customDataSource;
  } else if (endpoint) {
    // Only create an ODataStore if an endpoint is provided
    // Merge default options with the provided storeOptions
    const store = new ODataStore({
      url: endpoint,
      key: keyField,
      version: 4,
      keyType: 'Guid',
      fieldTypes: {
        projectGuid: 'Guid',
        ...(storeOptions.fieldTypes || {})
      },
      errorHandler: (error) => {
        // Use our API error handler to show notifications for errors
        const { errorHandler } = require('../error-handler');
        return errorHandler(error, {
          403: 'You do not have permission to perform this operation.'
        });
      },
      beforeSend: (options: any) => {

        
        // Ensure headers object exists
        if (!options.headers) {
          options.headers = {};
        }
        
        // Get token directly from token-store
        const token = getCurrentToken();
        if (token) {
          options.headers['Authorization'] = `Bearer ${token}`;

        }
        
        // Add method-specific headers for write operations
        const method = (options.method || '').toLowerCase();
        if (['patch', 'put', 'post'].includes(method)) {
          options.headers['Content-Type'] = 'application/json;odata.metadata=minimal';
          options.headers['Prefer'] = 'return=representation';
        }
        


        // Handle expand parameter based on the request method
        const url = new URL(options.url);
        
        if (method === 'get' && expand) {
          url.searchParams.set('$expand', expand.join(','));
        } else {
          url.searchParams.delete('$expand');
        }
        
        if ((method === 'patch' || method === 'put' || method === 'post') && expand && options.payload) {
          try {
            if (typeof options.payload === 'object' && options.payload !== null) {
              expand.forEach(navProp => {
                delete options.payload[navProp];
                delete options.payload[navProp.toLowerCase()];
              });
            } else if (typeof options.payload === 'string') {
              const payload = JSON.parse(options.payload);
              let modified = false;
              
              expand.forEach(navProp => {
                if (payload.hasOwnProperty(navProp) || payload.hasOwnProperty(navProp.toLowerCase())) {
                  delete payload[navProp];
                  delete payload[navProp.toLowerCase()];
                  modified = true;
                }
              });
              
              if (modified) {
                options.payload = JSON.stringify(payload);
              }
            }
          } catch (error) {
            console.error('Error modifying payload:', error);
          }
        }
        
        // Update the URL in the options
        options.url = url.toString();
        
        return true;
      },
      // Error events are handled globally via ajax.defaultSettings in devextreme-config.ts
    });

    const dataSourceOptions: Options = {
      store,
      sort: defaultSort || [{ selector: 'created', desc: true }]
    };
    
    // Apply grouping if enabled
    if (allowGrouping) {
      // First check if storeOptions has explicit grouping
      if (storeOptions.grouping && Array.isArray(storeOptions.grouping)) {
        dataSourceOptions.group = storeOptions.grouping;
      } 
      // Then check columns for groupIndex
      else {
        const groupColumns = columns
          .filter(col => col.groupIndex !== undefined && col.dataField)
          .sort((a, b) => (a.groupIndex || 0) - (b.groupIndex || 0))
          .map(col => ({
            selector: col.dataField || '',
            desc: false
          }));
        
        if (groupColumns.length > 0) {
          dataSourceOptions.group = groupColumns;

        }
      }
    }
    
    if (defaultFilter.length > 0) {
      dataSourceOptions.filter = defaultFilter;
    }
  
    dataSourceInstance = new DataSource(dataSourceOptions);
    
    // Token refresh is now handled by MSAL and API interceptors
    // No need for component-level token refresh logic
  } else {
    // Throw error if neither endpoint nor dataSource is provided
    throw new Error('Either endpoint or dataSource must be provided to ODataGrid');
  }

  // Generate summary items for numeric fields
  const numericColumnSummaries = columns
    .filter(column => 
      column.showSummary && 
      (column.dataType === 'number' || 
       column.summaryType === 'count')
    )
    .map(column => ({
      column: column.dataField,
      summaryType: column.summaryType || 'sum',
      valueFormat: column.summaryFormat,
      displayFormat: column.summaryType === 'count' 
        ? '{0} records' 
        : (column.summaryType === 'sum' 
            ? 'Total: {0}' 
            : `${column.summaryType}: {0}`)
    }));

  const onCellPrepared = (e: any) => {
    if (e.rowType === 'data') {
      const column = columns.find(col => col.dataField === e.column.dataField);
      if (column && (column.tooltip || column.hint)) {
        e.cellElement.title = column.tooltip || column.hint;
      }
    }
    
    if (e.rowType === 'header') {
      const column = columns.find(col => col.dataField === e.column.dataField);
      if (column && (column.tooltip || column.hint)) {
        if (e.cellElement.querySelector('.dx-datagrid-text-content')) {
          e.cellElement.querySelector('.dx-datagrid-text-content').title = column.tooltip || column.hint;
        } else {
          e.cellElement.title = column.tooltip || column.hint;
        }
      }
    }
  };

  const onSaving = (e: any) => {
    if (!e.changes || !e.changes.length) return;

    onSavingProp?.(e);
  };
  

  const handleRowValidating = (e: any) => {
    // Call the original validation handler if provided
    if (onRowValidating) {
      onRowValidating(e);
    }
    
    // If validation failed, show error as popup regardless of screen size
    if (!e.isValid) {
      // Use setTimeout to ensure this runs after the original handler finishes
      setTimeout(() => {
        notify({
          message: e.errorText || 'Validation error',
          type: 'error',
          displayTime: 3000,
          position: {
            at: 'top center',
            my: 'top center',
            offset: '0 10'
          }
        });
      }, 0);
    }
  };

  // Export success/error handler functions
  const handleExportSuccess = useCallback((format: string) => {
    notify({
      message: `Export to ${format} successful`,
      type: 'success',
      displayTime: 2000,
      position: {
        at: 'top center',
        my: 'top center',
        offset: '0 10'
      }
    });
  }, []);

  const handleExportError = useCallback((format: string, error: any) => {
    console.error(`Export to ${format} failed:`, error);
    notify({
      message: `Export to ${format} failed`,
      type: 'error',
      displayTime: 3000,
      position: {
        at: 'top center',
        my: 'top center',
        offset: '0 10'
      }
    });
  }, []);
  
  // Simple PDF export handler using DevExtreme's exportDataGridToPdf method
  const handleExportToPdf = useCallback(() => {
    try {
      if (dataGridRef.current?.instance) {
        const instance = dataGridRef.current.instance;
        
        const filename = exportConfig?.fileName || 
          (exportFileName ? exportFileName.replace(/\s+/g, '_') : 
          (title.trim() ? title.replace(/\s+/g, '_') : 'GridExport'));
        
        const doc = new jsPDF({
          orientation: 'landscape',
          unit: 'pt'
        });
        
        exportDataGrid({
          component: instance,
          jsPDFDocument: doc,
        }).then(() => {
          doc.save(`${filename}.pdf`);
          handleExportSuccess('PDF');
        });
      }
    } catch (error) {
      handleExportError('PDF', error);
    }
  }, [dataGridRef, title, exportFileName, exportConfig, handleExportSuccess, handleExportError]);

  // Add custom toolbar items with export buttons
  const onToolbarPreparing = useCallback((e: any) => {
    if (!allowExporting) return;
    
    // Get the index of the Excel export button (if it exists)
    const excelButtonIndex = e.toolbarOptions.items.findIndex(item => 
      item.name === 'exportButton' || (item.options && item.options.hint === 'Export to Excel')
    );
    // If we find the export button, we'll insert the PDF button before it so Excel appears on the right
    
    // Add PDF export button to the toolbar - before the Excel export button so Excel appears on the right
    if (excelButtonIndex !== -1) {

      e.toolbarOptions.items.splice(excelButtonIndex, 0, {
        location: 'after',
        widget: 'dxButton',
        options: {
          icon: 'exportpdf',
          hint: 'Export to PDF',
          onClick: handleExportToPdf
        }
      });
    } else {

      e.toolbarOptions.items.push({
        location: 'after',
        widget: 'dxButton',
        options: {
          icon: 'exportpdf',
          hint: 'Export to PDF',
          onClick: handleExportToPdf
        }
      });
    }
  }, [handleExportToPdf, allowExporting]);
  

  const onExporting = useCallback((e: any) => {
    if (e.format === 'pdf') {
      e.cancel = true;
      handleExportToPdf();
    }
  }, [handleExportToPdf]);

  const onExported = useCallback((e: any) => {
    if (e.format !== 'pdf') {
      const format = e.format || 'Excel';
      handleExportSuccess(format);
    }
  }, [handleExportSuccess]);

  return (
    <React.Fragment>
      <h2 className={'content-block'}>{title}</h2>
      <div 
        className="grid-container" 
        style={{ 
          width: '100%', 
          overflowX: 'auto', 
          height: screenSizeClass === 'screen-x-small' || screenSizeClass === 'screen-small' ? '600px' : 'calc(100vh - 170px)' 
        }}
      >
        <DataGrid
          ref={dataGridRef}
          id={`${title.replace(/\s+/g, '-').toLowerCase()}-grid`}
          dataSource={dataSourceInstance}
          showBorders={true}
          columnAutoWidth={true}
          allowColumnResizing={true}
          columnResizingMode="widget"
          height={screenSizeClass === 'screen-x-small' || screenSizeClass === 'screen-small' ? 550 : customGridHeight || 'calc(100vh - 185px)'}
          scrolling={{ 
            mode: "virtual",  
            useNative: false,  
            showScrollbar: 'onHover', 
            scrollByThumb: true       
          }}
          errorRowEnabled={false}
          remoteOperations={{
            filtering: true,
            paging: true,
            sorting: true,
            grouping: true,
            summary: false,
            groupPaging: false
          }}
          groupPanel={{ visible: showGroupPanel }}
          grouping={{ autoExpandAll: autoExpandAll }}
          onCellPrepared={onCellPrepared}
          editing={{
            mode: screenSizeClass === 'screen-x-small' || screenSizeClass === 'screen-small' ? 'popup' : 'cell',
            allowAdding: allowAdding,
            allowUpdating: allowUpdating,
            allowDeleting: allowDeleting,
            useIcons: true,
            popup: {
              title: `Edit ${title}`,
              showTitle: true,
              width: 800,
              height: 600,
              position: { my: 'center', at: 'center' }
            },
            form: {
              items: columns
                .filter((column) => !column.type && column.dataField && column.visible !== false) // Filter out command columns and hidden fields
                .map((column) => ({
                  dataField: column.dataField,
                  editorOptions: column.editorOptions || {}
                })),
              labelLocation: 'top'
            }
          }}
          onRowUpdating={onRowUpdating}
          onRowInserting={onRowInserting}
          onRowRemoving={onRowRemoving}
          onInitNewRow={onInitNewRow}
          onRowValidating={handleRowValidating}
          onEditorPreparing={onEditorPreparing}
          onInitialized={onInitialized}
          onSaving={onSaving}
          onExported={onExported}
          onExporting={onExporting}
          onToolbarPreparing={onToolbarPreparing}
          export={{
            enabled: allowExporting,
            allowExportSelectedData: exportConfig?.allowExportSelectedData || false,
            fileName: exportConfig?.fileName || (exportFileName ? exportFileName.replace(/\s+/g, '_') : (title.trim() ? title.replace(/\s+/g, '_') : 'GridExport')),
            texts: exportConfig?.texts
          }}
        >
          <Sorting mode="multiple" />
          {screenSizeClass === 'screen-x-small' || screenSizeClass === 'screen-small' ? (
            <>
              <Paging defaultPageSize={defaultPageSize} />
              <Pager showPageSizeSelector={true} showInfo={true} />
            </>
          ) : (
            <Paging enabled={false} />
          )}
          <FilterRow visible={true} />
          
          {/* Always render GroupPanel and Grouping components when allowGrouping is true */}
          {allowGrouping && <GroupPanel visible={showGroupPanel} />}
          {allowGrouping && <Grouping autoExpandAll={autoExpandAll} />}
          {columns.map((column) => {
            // Create a unique key for each column
            const columnKey = column.dataField || `${column.type}-${column.name || column.caption}`; // Use name if available for better uniqueness
            
            // Pass all properties from column to DevExtreme Column component
            // Common properties that all columns should have (except key)
            const commonProps = {
              caption: column.caption,
              width: column.width,
              // Allow fixed position columns to be more compact if they have a specified width
              minWidth: (column.fixed && column.width) ? undefined : (column.minWidth || 150),
              allowEditing: column.allowEditing,
              cssClass: column.cellClass,
              sortOrder: column.sortOrder,
              sortIndex: column.sortIndex,
              groupIndex: column.groupIndex,
              fixed: column.fixed,
              fixedPosition: column.fixedPosition
            };
            
            // Handle command columns (type="buttons")
            if (column.type === 'buttons') {
              return (
                <Column
                  key={columnKey}
                  {...commonProps}
                  dataField={column.dataField} // Explicitly pass dataField for button columns
                  type={column.type}
                  buttons={column.buttons ? column.buttons.map(button => ({
                    name: button.name,
                    hint: button.hint,   // Tooltip text
                    icon: button.icon,   // Button icon
                    text: button.text,   // Button text
                    visible: button.visible,
                    disabled: button.disabled,
                    onClick: button.onClick
                  })) : []}
                  cellTemplate={column.cellTemplate}
                />
              );
            }
            
            // Handle regular data columns
            return (
              <Column
                key={columnKey}
                {...commonProps}
                dataField={column.dataField}
                dataType={column.dataType}
                editorOptions={column.editorOptions}
                customizeText={column.customizeText}
                cellRender={column.cellRender}
                calculateDisplayValue={column.calculateDisplayValue}
              >
                {column.lookup && (
                  <Lookup
                    dataSource={column.lookup.dataSource}
                    valueExpr={column.lookup.valueExpr}
                    displayExpr={column.lookup.displayExpr}
                  />
                )}
              </Column>
            );
          })}
          <Summary>
            {showRecordCount && (
              <TotalItem
                summaryType="count"
                displayFormat="Total records: {0}"
                showInColumn={countColumn || "bookingCode"}
              />
            )}
            {numericColumnSummaries.map((summary, index) => (
              <TotalItem
                key={index}
                column={summary.column}
                summaryType={summary.summaryType}
                valueFormat={summary.valueFormat}
                displayFormat={summary.displayFormat}
              />
            ))}
          </Summary>
        </DataGrid>
      </div>
    </React.Fragment>
  );
};
