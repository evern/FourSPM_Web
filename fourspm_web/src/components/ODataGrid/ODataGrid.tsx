import React, { useRef, useEffect, useState } from 'react';
import { Properties } from 'devextreme/ui/data_grid';
import DataGrid, {
  Column,
  Paging,
  Pager,
  FilterRow,
  Editing,
  Lookup,
  Sorting
} from 'devextreme-react/data-grid';
import ODataStore from 'devextreme/data/odata/store';
import DataSource, { Options } from 'devextreme/data/data_source';
import { useAuth } from '../../contexts/auth';

export interface ODataGridColumn extends Partial<Column> {
  dataField: string;
  caption: string;
  width?: number;
  minWidth?: number;
  hidingPriority?: number;
  allowEditing?: boolean;
  dataType?: string;
  sortOrder?: 'asc' | 'desc';
  sortIndex?: number;
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
  defaultSort?: { selector: string; desc: boolean }[];
  expand?: string[];
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
  defaultSort,
  expand,
}) => {
  const { user } = useAuth();
  const token = user?.token;
  const dataGridRef = useRef<DataGrid>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Check if the device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // Common breakpoint for mobile
    };
    
    checkMobile(); // Check on initial render
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);
  
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
      if (error.httpStatus === 401) {
        localStorage.removeItem('user');
        window.location.href = '/login';
        return true;
      }
      return false;
    }
  });

  dataSourceOptions = {
    store,
    sort: defaultSort || [{ selector: 'created', desc: true }]
  };

  if (defaultFilter.length > 0) {
    dataSourceOptions.filter = defaultFilter;
  }

  const dataSourceInstance = new DataSource(dataSourceOptions);

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

  return (
    <React.Fragment>
      <h2 className={'content-block'}>{title}</h2>
      <div className="grid-container" style={{ 
        width: '100%', 
        overflowX: 'auto', 
        height: isMobile ? '600px' : 'calc(100vh - 170px)' 
      }}>
        <DataGrid
          ref={dataGridRef}
          className={'dx-card wide-card'}
          dataSource={dataSourceInstance}
          showBorders={false}
          columnAutoWidth={false}
          columnHidingEnabled={false}
          height={isMobile ? 550 : 'calc(100vh - 185px)'}
          remoteOperations={true}
          noDataText={`No ${title.toLowerCase()} found. Create a new one to get started.`}
          editing={{
            mode: isMobile ? 'popup' : 'cell',
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
          onRowValidating={onRowValidating}
          onEditorPreparing={onEditorPreparing}
          onInitialized={onInitialized}
          onSaving={onSaving}
        >
          <Sorting mode="multiple" />
          {isMobile ? (
            <>
              <Paging defaultPageSize={defaultPageSize} />
              <Pager showPageSizeSelector={true} showInfo={true} />
            </>
          ) : (
            <Paging enabled={false} />
          )}
          <FilterRow visible={true} />

          {columns.map((column) => (
            <Column
              key={column.dataField}
              dataField={column.dataField}
              caption={column.caption}
              dataType={column.dataType}
              minWidth={150}
              allowEditing={column.allowEditing}
              editorOptions={column.editorOptions}
              customizeText={column.customizeText}
              cellRender={column.cellRender}
              calculateDisplayValue={column.calculateDisplayValue}
              cssClass={column.cellClass}
              sortOrder={column.sortOrder}
              sortIndex={column.sortIndex}
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
