/**
 * Interfaces for grid handler events
 */

/**
 * Interface for editor preparation event
 */
export interface EditorEvent {
  editorName?: string;
  editorOptions: any;
  dataField?: string;
  row?: {
    data: any;
    isNewRow: boolean;
  };
  component?: any;
  cancel?: boolean;
}

/**
 * Interface for new row initialization event
 */
export interface InitNewRowEvent {
  data: any;
  component?: any;
}
