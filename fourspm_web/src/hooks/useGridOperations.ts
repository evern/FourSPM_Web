import { Properties } from 'devextreme/ui/data_grid';
import { useAuth } from '../contexts/auth';

interface GridOperationsConfig {
  endpoint: string;
  onDeleteSuccess?: () => void;
  onDeleteError?: (error: Error) => void;
}

export const useGridOperations = ({ endpoint, onDeleteSuccess, onDeleteError }: GridOperationsConfig) => {
  const { user } = useAuth();

  const handleRowUpdating: Properties['onRowUpdating'] = (e) => {
    const updateData = {};
    Object.keys(e.newData || {}).forEach(key => {
      if (e.newData[key] !== undefined && e.newData[key] !== null) {
        updateData[key] = e.newData[key];
      }
    });
    e.newData = updateData;
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
    handleRowRemoving
  };
};
