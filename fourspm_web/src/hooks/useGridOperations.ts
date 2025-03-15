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
  endpoint, 
  onDeleteSuccess, 
  onDeleteError,
  onUpdateSuccess,
  onUpdateError,
  onInsertSuccess,
  onInsertError
}: GridOperationsConfig) => {
  const { user } = useAuth();

  const handleRowUpdating: Properties['onRowUpdating'] = async (e) => {
    const updateData = {};
    Object.keys(e.newData || {}).forEach(key => {
      if (e.newData[key] !== undefined && e.newData[key] !== null) {
        updateData[key] = e.newData[key];
      }
    });
    e.newData = updateData;

    try {
      const response = await fetch(`${endpoint}(${e.key})`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        throw new Error('Failed to update item');
      }

      onUpdateSuccess?.();
    } catch (error) {
      console.error('Error updating item:', error);
      e.cancel = true;
      onUpdateError?.(error as Error);
      window.alert('Error updating item');
    }
  };

  const handleRowInserting: Properties['onRowInserting'] = async (e) => {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(e.data)
      });

      if (!response.ok) {
        throw new Error('Failed to create item');
      }

      onInsertSuccess?.();
    } catch (error) {
      console.error('Error creating item:', error);
      e.cancel = true;
      onInsertError?.(error as Error);
      window.alert('Error creating item');
    }
  };

  const handleRowRemoving: Properties['onRowRemoving'] = async (e) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      e.cancel = true;
      return;
    }

    try {
      const response = await fetch(`${endpoint}(${e.key})`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete item');
      }

      onDeleteSuccess?.();
    } catch (error) {
      console.error('Error deleting item:', error);
      e.cancel = true;
      onDeleteError?.(error as Error);
      window.alert('Error deleting item');
    }
  };

  return {
    handleRowUpdating,
    handleRowRemoving,
    handleRowInserting
  };
};
