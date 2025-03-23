import { Properties } from 'devextreme/ui/data_grid';
import { useAuth } from '../contexts/auth';

interface GridOperationsConfig {
  endpoint: string;
  onDeleteSuccess?: () => void;
  onDeleteError?: (error: Error) => void;
  onUpdateSuccess?: () => void;
  onUpdateError?: (error: Error) => void;
  onInsertSuccess?: () => void;
  onInsertError?: (error: Error) => void;
}

export const useGridOperations = ({ 
  onDeleteSuccess, 
  onDeleteError,
  onUpdateSuccess,
  onUpdateError,
  onInsertSuccess,
  onInsertError
}: GridOperationsConfig) => {
  
  // These methods are lightweight wrappers that simply call the appropriate success/error callbacks
  // DevExtreme's DataGrid with ODataStore will handle the actual CRUD operations
  
  const handleRowUpdating: Properties['onRowUpdating'] = async (e) => {
    const changes = e.component.option('editing.changes') as Array<{ onSuccess?: (result: any) => void, onError?: (error: Error) => void }>;
    
    if (changes && changes.length > 0) {
      const originalOnSuccess = changes[0].onSuccess;
      
      changes[0].onSuccess = (result: any) => {
        if (originalOnSuccess) originalOnSuccess(result);
        onUpdateSuccess?.();
      };
      
      changes[0].onError = (error: Error) => {
        console.error('Error updating item:', error);
        onUpdateError?.(error);
      };
    }
  };

  const handleRowInserting: Properties['onRowInserting'] = async (e) => {
    const changes = e.component.option('editing.changes') as Array<{ onSuccess?: (result: any) => void, onError?: (error: Error) => void }>;
    
    if (changes && changes.length > 0) {
      const originalOnSuccess = changes[0].onSuccess;
      
      changes[0].onSuccess = (result: any) => {
        if (originalOnSuccess) originalOnSuccess(result);
        onInsertSuccess?.();
      };
      
      changes[0].onError = (error: Error) => {
        console.error('Error creating item:', error);
        onInsertError?.(error);
      };
    }
  };

  const handleRowRemoving: Properties['onRowRemoving'] = async (e) => {
    const changes = e.component.option('editing.changes') as Array<{ onSuccess?: (result: any) => void, onError?: (error: Error) => void }>;
    
    if (changes && changes.length > 0) {
      const originalOnSuccess = changes[0].onSuccess;
      
      changes[0].onSuccess = (result: any) => {
        if (originalOnSuccess) originalOnSuccess(result);
        onDeleteSuccess?.();
      };
      
      changes[0].onError = (error: Error) => {
        console.error('Error deleting item:', error);
        onDeleteError?.(error);
      };
    }
  };

  return {
    handleRowUpdating,
    handleRowRemoving,
    handleRowInserting
  };
};
