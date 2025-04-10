import React, { useRef } from 'react';
import { Properties } from 'devextreme/ui/data_grid';
import DataGrid, {
  Column,
  Paging,
  Pager,
  FilterRow,
  Lookup,
  Sorting,
  Summary,
  TotalItem
} from 'devextreme-react/data-grid';
import ODataStore from 'devextreme/data/odata/store';
import DataSource, { Options } from 'devextreme/data/data_source';
import { useAuth } from '../../contexts/auth';
import notify from 'devextreme/ui/notify';
import { useScreenSizeClass } from '../../utils/media-query';

export interface ODataGridColumn extends Partial<Column> {
  // Standard column properties
  dataField?: string; // Make optional to support command columns
  caption: string;
  width?: number;
  minWidth?: number;
  hidingPriority?: number;
  allowEditing?: boolean;
  dataType?: string;
  sortOrder?: 'asc' | 'desc';
  sortIndex?: number;
  fixed?: boolean;
  fixedPosition?: 'left' | 'right';
  name?: string; // Used to uniquely identify columns especially for button columns
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
  
  // Command column properties
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
  endpoint?: string;
  dataSource?: any; // New prop to accept custom dataSource
  columns: ODataGridColumn[];
  keyField: string;
  defaultPageSize?: number;
  allowAdding?: boolean;
  allowUpdating?: boolean;
  allowDeleting?: boolean;
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
  loading?: boolean; // Loading state prop
  storeOptions?: any; // Options passed to the ODataStore
}

export const ODataGrid: React.FC<ODataGridProps> = ({
  title,
  endpoint,
  dataSource: customDataSource, // Accept custom dataSource
  columns,
  keyField,
  defaultPageSize = 10,
  allowAdding = true,
  allowUpdating = true,
  allowDeleting = true,
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
  loading = false, // Default to false if not provided
  storeOptions = {}, // Default to empty object if not provided
}) => {
  const { user } = useAuth();
  const token = user?.token;
  const dataGridRef = useRef<DataGrid>(null);
  const screenSizeClass = useScreenSizeClass();

  let dataSourceInstance;

  // Use the provided custom dataSource if available, otherwise create one from the endpoint
  if (customDataSource) {
    dataSourceInstance = customDataSource;
  } else if (endpoint) {
    // Only create an ODataStore if an endpoint is provided
    // Merge default options with the provided storeOptions
    let store = new ODataStore({
      url: endpoint,
      version: 4,
      key: keyField,
      keyType: 'Guid',
      // Merge default fieldTypes with those provided in storeOptions.fieldTypes
      fieldTypes: {
        projectGuid: 'Guid',
        ...(storeOptions.fieldTypes || {})
      },
      beforeSend: (options: any) => {
        if (!token) {
          return false;
        }
  
        options.headers = {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        };
  
        // Handle expand parameter based on the request method
        const url = new URL(options.url);
        const method = (options.method || '').toLowerCase();
        
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
        
        options.url = url.toString();
  
        // Set appropriate headers for all HTTP methods
        if (options.method === 'PUT' || options.method === 'PATCH' || options.method === 'POST') {
          options.headers['Content-Type'] = 'application/json;odata.metadata=minimal;odata.streaming=true';
          options.headers['Prefer'] = 'return=minimal';
        }
        
        return true;
      },
      errorHandler: (error) => {
        // Handle unauthorized access by redirecting to login
        if (error.httpStatus === 401) {
          localStorage.removeItem('user');
          window.location.href = '/login';
          return true;
        }
        
        // Extract error message from the error object
        // DevExtreme OData errors can have the message in different places
        let errorMessage = '';
        if (error.errorDetails && error.errorDetails.message) {
          errorMessage = error.errorDetails.message;
        } else if (error.errorDetails && typeof error.errorDetails === 'string') {
          errorMessage = error.errorDetails;
        } else if (error.requestOptions && error.requestOptions.data) {
          errorMessage = 'Operation failed';
        }
        
        // Handle validation errors (HTTP 400) using toast notifications
        if (error.httpStatus === 400) {
          notify({
            message: errorMessage || 'Cannot complete operation due to validation errors',
            type: 'error',
            displayTime: 3500,
            position: {
              at: 'top center',
              my: 'top center',
              offset: '0 10'
            },
            width: 'auto',
            animation: {
              show: { type: 'fade', duration: 300, from: 0, to: 1 },
              hide: { type: 'fade', duration: 300, from: 1, to: 0 }
            }
          });
          return true;
        }
        
        // Handle server errors (HTTP 500) using toast notifications
        if (error.httpStatus >= 500) {
          notify({
            message: errorMessage || 'A server error occurred. Please try again later.',
            type: 'error',
            displayTime: 3500,
            position: {
              at: 'top center',
              my: 'top center',
              offset: '0 10'
            }
          });
          return true;
        }
        
        return false;
      }
    });
  
    let dataSourceOptions: Options = {
      store,
      sort: defaultSort || [{ selector: 'created', desc: true }]
    };
  
    if (defaultFilter.length > 0) {
      dataSourceOptions.filter = defaultFilter;
    }
  
    dataSourceInstance = new DataSource(dataSourceOptions);
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
  
  // Handle validation errors by showing them as popups when in form/popup editing mode
  const handleRowValidating = (e: any) => {
    // Call the original validation handler if provided
    if (onRowValidating) {
      onRowValidating(e);
    }
    
    // If validation failed and we're in popup/form mode, show error as popup
    if (!e.isValid && (screenSizeClass === 'screen-x-small' || screenSizeClass === 'screen-small')) {
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
          className={'dx-card wide-card'}
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
          remoteOperations={{
            filtering: true,
            paging: true,
            sorting: true,
            summary: false // Always calculate summaries locally
          }}
          loadPanel={{ enabled: loading }}
          noDataText={`No ${title.toLowerCase()} found. Create a new one to get started.`}
          errorRowEnabled={false}
          editing={{
            mode: screenSizeClass === 'screen-x-small' || screenSizeClass === 'screen-small' ? 'popup' : 'cell',
            allowAdding,
            allowUpdating,
            allowDeleting,
            useIcons: true
          }}
          onCellPrepared={onCellPrepared}
          onRowUpdating={onRowUpdating}
          onRowInserting={onRowInserting}
          onRowRemoving={onRowRemoving}
          onInitNewRow={onInitNewRow}
          onRowValidating={handleRowValidating}
          onEditorPreparing={onEditorPreparing}
          onInitialized={onInitialized}
          onSaving={onSaving}
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
