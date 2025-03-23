import React, { useRef } from 'react';
import { EventInfo } from 'devextreme/events';
import { Properties } from 'devextreme/ui/data_grid';
import DataGrid, {
  Column,
  Paging,
  Pager,
  FilterRow,
  Editing,
  Lookup
} from 'devextreme-react/data-grid';
import ODataStore from 'devextreme/data/odata/store';
import DataSource, { Options } from 'devextreme/data/data_source';
import { useAuth } from '../../contexts/auth';

export interface ODataGridColumn extends Partial<Column> {
  dataField: string;
  caption: string;
  hidingPriority?: number;
  allowEditing?: boolean;
  dataType?: string;
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
}

interface ODataGridProps {
  title: string;
  endpoint: string;
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
}

export const ODataGrid: React.FC<ODataGridProps> = ({
  title,
  endpoint,
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
}) => {
  const { user } = useAuth();
  const token = user?.token;
  const dataGridRef = useRef<DataGrid>(null);

  let store;
  let dataSourceOptions: Options;

  store = new ODataStore({
    url: endpoint,
    version: 4,
    key: keyField,
    keyType: 'Guid',
    fieldTypes: {
      projectGuid: 'Guid'
    },
    beforeSend: (options: any) => {
      if (!token) {
        console.error('No token available');
        return false;
      }

      options.headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      };

      // Set appropriate headers for all HTTP methods
      if (options.method === 'PUT' || options.method === 'PATCH' || options.method === 'POST') {
        options.headers['Content-Type'] = 'application/json;odata.metadata=minimal;odata.streaming=true';
        options.headers['Prefer'] = 'return=minimal';
      }
      
      return true;
    },
    errorHandler: (error) => {
      if (error.httpStatus === 401) {
        console.log('Token expired, redirecting to login...');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return true;
      }
      return false;
    }
  });

  dataSourceOptions = {
    store
  };

  if (defaultFilter.length > 0) {
    dataSourceOptions.filter = defaultFilter;
  }

  const dataSourceInstance = new DataSource(dataSourceOptions);

  const onCellPrepared = (e: any) => {
    // Apply tooltips to data cells
    if (e.rowType === 'data') {
      const column = columns.find(col => col.dataField === e.column.dataField);
      if (column && (column.tooltip || column.hint)) {
        e.cellElement.title = column.tooltip || column.hint;
      }
    }
    
    // Apply tooltips to column headers
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
    // If there are no changes, don't do anything
    if (!e.changes || !e.changes.length) return;

    // Log changes for debugging
    console.log('Batch changes:', e.changes);

    // Default saving behavior works fine
    // But if you need custom saving logic, you can implement it here:
    // e.cancel = true; // Cancel default saving behavior
    // Process changes manually
    // Then refresh the grid: dataGridRef.current?.instance.refresh();
  };

  return (
    <React.Fragment>
      <h2 className={'content-block'}>{title}</h2>
      <div style={{ width: '100%', overflowX: 'auto', height: '600px' }}>
        <DataGrid
          ref={dataGridRef}
          className={'dx-card wide-card'}
          dataSource={dataSourceInstance}
          showBorders={false}
          focusedRowEnabled={true}
          defaultFocusedRowIndex={0}
          columnAutoWidth={true}
          columnHidingEnabled={true}
          remoteOperations={true}
          height={550}
          scrolling={{ mode: 'standard', showScrollbar: 'always' }}
          noDataText={`No ${title.toLowerCase()} found. Create a new one to get started.`}
          editing={{
            mode: 'cell',
            allowAdding,
            allowUpdating,
            allowDeleting,
            useIcons: true,
            texts: {
              saveAllChanges: 'Save Changes',
              cancelAllChanges: 'Discard Changes',
              saveRowChanges: 'Save',
              cancelRowChanges: 'Cancel',
              editRow: 'Edit',
              deleteRow: 'Delete'
            }
          }}
          onCellPrepared={onCellPrepared}
          onRowUpdating={onRowUpdating}
          onRowInserting={onRowInserting}
          onRowRemoving={onRowRemoving}
          onInitNewRow={onInitNewRow}
          onRowValidating={onRowValidating}
          onEditorPreparing={onEditorPreparing}
          onInitialized={onInitialized}
          onSaving={onSavingProp || onSaving}
        >
          <Paging defaultPageSize={defaultPageSize} />
          <Pager showPageSizeSelector={true} showInfo={true} />
          <FilterRow visible={true} />

          {columns.map((column) => (
            <Column
              key={column.dataField}
              dataField={column.dataField}
              caption={column.caption}
              dataType={column.dataType}
              hidingPriority={column.hidingPriority}
              minWidth={'150'}
              allowResizing={true}
              allowEditing={column.allowEditing}
              editorOptions={column.editorOptions}
              customizeText={column.customizeText}
              cellRender={column.cellRender}
              calculateDisplayValue={column.calculateDisplayValue}
              cssClass={column.cellClass}
            >
              {column.lookup && (
                <Lookup
                  dataSource={column.lookup.dataSource}
                  valueExpr={column.lookup.valueExpr}
                  displayExpr={column.lookup.displayExpr}
                />
              )}
            </Column>
          ))}
        </DataGrid>
      </div>
    </React.Fragment>
  );
};
