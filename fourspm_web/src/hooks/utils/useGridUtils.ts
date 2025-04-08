import { useState, useCallback, useRef, useEffect } from 'react';
import { GridUtils } from '../interfaces/grid-utils.interface';

/**
 * Hook that provides common grid utility operations without exposing the grid instance.
 * This follows the pattern of other utility hooks like useProjectInfo.
 * @returns Grid utility functions for managing grid instance
 */
export const useGridUtils = (): GridUtils => {
  // Keep grid instance private within the hook
  const [gridInstance, setGridInstance] = useState<any>(null);
  
  // Create a ref to store the grid instance for direct access
  const gridInstanceRef = useRef<any>(null);
  
  // Sync state and ref
  useEffect(() => {
    if (gridInstance) {
      gridInstanceRef.current = gridInstance;
    }
  }, [gridInstance]);
  
  // Queue of pending operations to execute once grid is available
  const pendingOpsRef = useRef<Array<{rowIndex: number, fieldName: string, value: any}>>([])
  
  /**
   * Cancels the current edit operation on the grid
   */
  const cancelEditData = useCallback(() => {
    if (gridInstanceRef.current) {
      try {
        gridInstanceRef.current.cancelEditData();
        return true;
      } catch (error) {
        console.error('Error canceling edit data:', error);
        return false;
      }
    }
    return false;
  }, []);

  /**
   * Sets a cell value programmatically with resilient handling
   */
  const setCellValue = useCallback((rowIndex: number, fieldName: string, value: any) => {
    // First try to use the ref (most direct and reliable)
    if (gridInstanceRef.current) {
      try {
        // Use the ref instance directly
        gridInstanceRef.current.cellValue(rowIndex, fieldName, value);
        return true;
      } catch (error) {
        console.error(`Error setting ${fieldName} cell value with ref:`, error);
      }
    }
    
    // Then try the state variable
    if (gridInstance) {
      try {
        gridInstance.cellValue(rowIndex, fieldName, value);
        return true;
      } catch (error) {
        console.error(`Error setting ${fieldName} cell value with state:`, error);
      }
    }
    
    // Queue the operation as last resort
    pendingOpsRef.current.push({ rowIndex, fieldName, value });
    return false;
  }, [gridInstance]);
  
  /**
   * Save grid instance for later use and process any pending operations
   */
  const handleGridInitialized = useCallback((e: any) => {
    // First, update the ref immediately
    gridInstanceRef.current = e.component;
    
    // Then update the state
    setGridInstance(e.component);
    
    // Process any pending operations
    if (pendingOpsRef.current.length > 0) {
      setTimeout(() => {
        pendingOpsRef.current.forEach(op => {
          try {
            e.component.cellValue(op.rowIndex, op.fieldName, op.value);
          } catch (error) {
            console.error(`Error processing queued operation for ${op.fieldName}:`, error);
          }
        });
        pendingOpsRef.current = [];
      }, 50); // Short delay to ensure grid is ready
    }
  }, []);
  
  /**
   * Get direct access to the grid instance (use with caution)
   * Uses ref for most direct access to avoid React state update delays
   */
  const getGridInstance = useCallback(() => {
    return gridInstanceRef.current || gridInstance;
  }, [gridInstance]);
  
  /**
   * Reload the grid's data source without a full refresh
   * Uses a safe approach that first cancels any active edit operations
   */
  const reloadGridDataSource = useCallback(() => {
    if (!gridInstance) {
      console.warn('Cannot reload grid data source - grid instance is not available');
      return false;
    }
    
    try {
      // First end edit mode if active
      if (gridInstance.hasEditData && gridInstance.hasEditData()) {
        gridInstance.cancelEditData();
      }
      
      // Then reload just the data source if possible
      if (gridInstance.getDataSource) {
        const dataSource = gridInstance.getDataSource();
        if (dataSource && dataSource.reload) {
          dataSource.reload();
          return true;
        }
      }
      
      // Fall back to full refresh if data source reload isn't available
      gridInstance.refresh();
      return true;
    } catch (error) {
      console.error('Error reloading grid data source:', error);
      // Try fallback refresh
      try {
        gridInstance.refresh();
        return true;
      } catch (refreshError) {
        console.error('Error with fallback grid refresh:', refreshError);
        return false;
      }
    }
  }, [gridInstance]);

  // Return public API
  return {
    setCellValue,
    handleGridInitialized,
    reloadGridDataSource,
    cancelEditData
  };
};
