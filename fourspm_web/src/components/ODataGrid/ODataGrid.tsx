import React, { useRef, useEffect, useState, useCallback } from 'react';
import { EventInfo } from 'devextreme/events';
import { Properties } from 'devextreme/ui/data_grid';
import DataGrid, {
  Column,
  Paging,
  Pager,
  FilterRow,
  Editing,
  Lookup,
  Toolbar
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
  onSetCellValue?: (rowIndex: number, fieldName: string, value: any) => boolean;
  defaultFilter?: [string, string, any][];
  expand?: string[];
  formConfig?: any;
  fetchSuggestedDocumentNumber?: (deliverableTypeId: string, areaNumber: string, discipline: string, documentType: string) => Promise<string>;
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
  onInitialized: onInitializedProp,
  onSaving: onSavingProp,
  onSetCellValue,
  defaultFilter = [],
  expand,
  formConfig,
  fetchSuggestedDocumentNumber,
}) => {
  const { user } = useAuth();
  const token = user?.token;
  const dataGridRef = useRef<DataGrid>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [editingMode, setEditingMode] = useState<'cell' | 'popup'>(isMobile ? 'popup' : 'cell');
  const [isAddingRow, setIsAddingRow] = useState(false);
  const gridInitializedRef = useRef(false);

  // Update mobile check effect to also update editingMode
  useEffect(() => {
    const checkMobile = () => {
      const isMobileView = window.innerWidth < 768;
      setIsMobile(isMobileView);
      // Only change editing mode on mobile change if not actively editing
      if (!isAddingRow) {
        setEditingMode(isMobileView ? 'popup' : 'cell');
      }
    };
    
    checkMobile(); // Check on initial render
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, [isAddingRow]);

  let store;
  let dataSource;

  store = new ODataStore({
    url: endpoint,
    key: keyField,
    version: 4,
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

  // Helper function to create data source based on props
  const getDataSource = useCallback(() => {
    if (!dataSource && store) {
      // Create a data source with the store
      const dsOptions: Options = {
        store: store
      };
      
      // Apply default filters if provided
      if (defaultFilter.length > 0) {
        dsOptions.filter = defaultFilter;
      }
      
      // Create the DataSource instance
      dataSource = new DataSource(dsOptions);
    }
    
    return dataSource;
  }, [dataSource, store, defaultFilter]);

  const dataSourceInstance = getDataSource();

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

  // Setup grid options on initial render
  const onInitialized = useCallback((e: any) => {
    // Call the user-provided onInitialized if available
    if (onInitializedProp) {
      onInitializedProp(e);
    }
    
    // Cache the grid instance to prevent reloading
    if (e.component && !gridInitializedRef.current) {
      const gridInstance = e.component;
      
      // Listen for row adding event to help distinguish between add/edit operations
      gridInstance.option('onEditingStart', (e: any) => {
        // Set editing mode based on whether this is a new row or existing row
        if (e.data && !e.key) {
          // This is a new row
          console.log('Add mode detected');
          setIsAddingRow(true);
        } else {
          // This is an existing row
          console.log('Edit mode detected');
          setIsAddingRow(false);
        }
      });
      
      // Override how save is processed to ensure proper insert handling
      const originalGetSaveChange = gridInstance._getSaveChange;
      if (originalGetSaveChange) {
        gridInstance._getSaveChange = function(changes) {
          const change = changes[0];
          if (change && change.type === 'insert') {
            console.log('INSERT detected, marking record as new');
            // Force additional marker to ensure insert
            change.data.__IS_NEW = true;
          }
          return originalGetSaveChange.apply(this, arguments);
        };
      }
      
      gridInitializedRef.current = true;
    }
  }, [onInitializedProp]);

  // Handle form init event to maintain adding state
  const handleFormInit = useCallback((e: any) => {
    console.log('Form initialized', e);
    // Important: Don't mark it as a new row by adding a __isNewRow property
    // This can confuse DevExtreme's internal insert vs update logic
  }, []);

  // Handle adding a row - following the DevExtreme recommended pattern from memory
  const handleAddRowWithoutReload = useCallback(() => {
    if (dataGridRef.current?.instance) {
      // First switch to popup mode
      setEditingMode('popup');
      
      // Use setTimeout to ensure the mode change is processed
      // This directly follows the pattern from the memory
      setTimeout(() => {
        // Set adding flag to track state
        setIsAddingRow(true);
        
        // Add the row after mode is properly set
        if (dataGridRef.current?.instance) {
          dataGridRef.current.instance.addRow();
        }
      }, 0);
    }
  }, []);

  // Handle popup hiding - exactly like the DevExtreme Angular example
  const handlePopupHiding = useCallback(() => {
    // This matches the onHiding in the Angular example
    setIsAddingRow(false);
    
    if (dataGridRef.current?.instance) {
      // Switch back to preferred mode
      const newMode = isMobile ? 'popup' : 'cell';
      
      // First update the grid directly (like in the example)
      dataGridRef.current.instance.option('editing.mode', newMode);
      
      // Then update our state to match
      setEditingMode(newMode);
    }
  }, [isMobile]);

  // Handle row insertion events
  const handleRowInserted = useCallback(() => {
    // Reset the flag after successful insertion
    setIsAddingRow(false);
  }, []);

  // Custom toolbar with Add button
  const renderToolbar = useCallback((e: any) => {
    // Find and remove the default add button if it exists
    const addButtonIndex = e.toolbarOptions.items.findIndex(
      (item: any) => item.name === 'addRowButton'
    );
    if (addButtonIndex !== -1) {
      e.toolbarOptions.items.splice(addButtonIndex, 1);
    }
    
    // Add our custom add button if adding is allowed
    if (allowAdding) {
      e.toolbarOptions.items.unshift({
        location: 'before',
        widget: 'dxButton',
        options: {
          icon: 'plus',
          text: `Add New ${title.replace(/s$/, '')}`,
          onClick: handleAddRowWithoutReload
        }
      });
    }
  }, [allowAdding, title, handleAddRowWithoutReload]);

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
            mode: editingMode,
            allowAdding,
            allowUpdating,
            allowDeleting,
            useIcons: true,
            popup: editingMode === 'popup' ? {
              title: `${isAddingRow ? 'Add' : 'Edit'} ${title}`,
              showTitle: true,
              width: 'auto',
              height: 'auto',
              position: { my: 'center', at: 'center', of: window },
              onHiding: handlePopupHiding,
              onInitialized: handleFormInit,
              showCloseButton: true
            } : undefined,
            form: editingMode === 'popup' ? {
              labelLocation: 'top',
              ...formConfig
            } : undefined,
            texts: {
              saveRowChanges: 'Save',
              cancelRowChanges: 'Cancel',
              editRow: 'Edit',
              deleteRow: 'Delete'
            }
          }}
          onCellPrepared={onCellPrepared}
          onRowUpdating={onRowUpdating}
          onRowInserting={onRowInserting}
          onRowInserted={handleRowInserted}
          onRowRemoving={onRowRemoving}
          onInitNewRow={onInitNewRow}
          onRowValidating={onRowValidating}
          onEditorPreparing={onEditorPreparing}
          onInitialized={onInitialized}
          onSaving={onSaving}
          onToolbarPreparing={renderToolbar}
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
