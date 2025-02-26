import React from 'react';
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

export interface ODataGridColumn {
  dataField: string;
  caption: string;
  hidingPriority?: number;
  lookup?: {
    dataSource: any | { store: ODataStore };
    valueExpr: string;
    displayExpr: string;
  };
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
  onRowUpdating?: Properties['onRowUpdating'];
  onRowInserting?: Properties['onRowInserting'];
  onRowRemoving?: Properties['onRowRemoving'];
  onInitNewRow?: Properties['onInitNewRow'];
  onRowValidating?: Properties['onRowValidating'];
  defaultFilter?: Array<[string, string, any]>;
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
  defaultFilter = []
}) => {
  const { user } = useAuth();
  const token = user?.token;

  const store = new ODataStore({
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

      if (options.method === 'PATCH') {
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

  const dataSourceOptions: Options = {
    store
  };

  if (defaultFilter.length > 0) {
    dataSourceOptions.filter = defaultFilter;
  }

  const dataSource = new DataSource(dataSourceOptions);

  return (
    <React.Fragment>
      <h2 className={'content-block'}>{title}</h2>
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <DataGrid
          className={'dx-card wide-card'}
          dataSource={dataSource}
          showBorders={false}
          focusedRowEnabled={true}
          defaultFocusedRowIndex={0}
          columnAutoWidth={true}
          columnHidingEnabled={true}
          remoteOperations={true}
          height="auto"
          scrolling={{ mode: 'standard', showScrollbar: 'always' }}
          noDataText={`No ${title.toLowerCase()} found. Create a new one to get started.`}
          editing={{
            mode: 'row',
            allowAdding,
            allowUpdating,
            allowDeleting,
            useIcons: true,
            texts: {
              saveRowChanges: 'Save',
              cancelRowChanges: 'Cancel',
              editRow: 'Edit',
              deleteRow: 'Delete'
            }
          }}
          onRowUpdating={onRowUpdating}
          onRowInserting={onRowInserting}
          onRowRemoving={onRowRemoving}
          onInitNewRow={onInitNewRow}
          onRowValidating={onRowValidating}
        >
          <Paging defaultPageSize={defaultPageSize} />
          <Pager showPageSizeSelector={true} showInfo={true} />
          <FilterRow visible={true} />

          {columns.map((column) => (
            <Column 
              key={column.dataField}
              dataField={column.dataField}
              caption={column.caption}
              hidingPriority={column.hidingPriority}
              minWidth={'150'}
              allowResizing={true}
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
