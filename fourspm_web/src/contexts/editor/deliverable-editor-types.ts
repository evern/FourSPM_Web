import { Deliverable } from '@/types/odata-types';
import React from 'react';

/**
 * State interface for the deliverable editor context
 */
export interface DeliverableEditorState {
  isGeneratingDocumentNumber: boolean;
  error: string | null;
  // Tracks which deliverable fields trigger updates to other fields
  deliverableFieldDependencies: Record<string, string[]>;
}

/**
 * Parameters for document number generation
 */
export interface DocumentNumberParams {
  deliverableTypeId: string | number;
  areaNumber: string;
  discipline: string;
  documentType: string;
  guid?: string;
  projectId?: string;
}

/**
 * Editor event for DevExtreme components
 */
export interface EditorEvent {
  component: any;
  element: any;
  model: any;
  editorOptions: {
    onValueChanged?: (args: any) => void;
    buttons?: Array<{
      name: string;
      location: string;
      options: {
        icon: string;
        type: string;
        hint: string;
        onClick: () => void;
      }
    }>;
    [key: string]: any;
  };
  editorName: string;
  dataField: string;
  row: {
    data: Record<string, any>;
    key: any;
    rowIndex: number;
    isNewRow?: boolean;
    values: any[];
  };
  parentType: string;
}

/**
 * Row initialization event for DevExtreme grids
 */
export interface InitNewRowEvent {
  component: any;
  element: any;
  data: Record<string, any>;
}

/**
 * Hooks returned by useDeliverableEditor with improved type safety
 */
export interface DeliverableEditorHooks {
  state: DeliverableEditorState;
  
  // Document number generation for deliverables
  fetchSuggestedDeliverableDocumentNumber: (params: DocumentNumberParams) => Promise<string>;
  
  // Document number auto-update for deliverables
  updateDeliverableDocumentNumber: (params: DocumentNumberParams & { row: any }) => Promise<void>;
  
  // Get default values for new deliverable
  getDefaultDeliverableValues: (projectId?: string) => Partial<Deliverable>;
  
  // Editor preparation for DevExtreme fields
  handleDeliverableEditorPreparing: (e: EditorEvent) => void;
  
  // Handle new deliverable row initialization
  handleDeliverableInitNewRow: (e: InitNewRowEvent) => void;
}

/**
 * Props interface for the DeliverableEditorProvider component
 */
export interface DeliverableEditorProviderProps {
  children: React.ReactNode;
}

/**
 * Context props interface combining all functionality
 */
export interface DeliverableEditorContextProps extends DeliverableEditorHooks {
  // Additional context-specific props can go here if needed
}

/**
 * Action types for the deliverable editor reducer
 */
export type DeliverableEditorAction = 
  | { type: 'SET_GENERATING_DOCUMENT_NUMBER'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };
