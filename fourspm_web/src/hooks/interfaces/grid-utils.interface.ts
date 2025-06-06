/**
 * Interface for common grid utility operations.
 * Provides methods for managing grid instance without exposing the instance itself.
 */
export interface GridUtils {
  /**
   * Handler for grid initialization event, captures the grid instance
   * @param e Grid initialization event
   */
  handleGridInitialized: (e: any) => void;
  
  /**
   * Sets a cell value programmatically
   * @param rowIndex Index of the row to update
   * @param fieldName Name of the field to update
   * @param value New value to set
   * @returns Boolean indicating success (true) or failure (false)
   */
  setCellValue: (rowIndex: number, fieldName: string, value: any) => boolean;
  
  /**
   * Reloads the grid's data source without a full refresh
   * Will automatically cancel any active edit operations first
   * @returns Boolean indicating success (true) or failure (false)
   */
  reloadGridDataSource: () => boolean;
  
  /**
   * Cancels the current edit operation on the grid
   * @returns Boolean indicating success (true) or failure (false)
   */
  cancelEditData: () => boolean;
}
