/**
 * Centralized storage keys for grid state persistence
 * 
 * These keys are used with the stateStoring feature of ODataGrid to ensure
 * consistent naming across the application.
 */

// Format: GRID_STATE_PAGE_NAME

// Page-specific grid state keys
export const GRID_STATE_DELIVERABLES = 'fourspm_grid_deliverables_state';
export const GRID_STATE_CLIENTS = 'fourspm_grid_clients_state';
export const GRID_STATE_PROJECTS = 'fourspm_grid_projects_state';
export const GRID_STATE_AREAS = 'fourspm_grid_areas_state';
export const GRID_STATE_DISCIPLINES = 'fourspm_grid_disciplines_state';
export const GRID_STATE_DOCUMENT_TYPES = 'fourspm_grid_document_types_state';
export const GRID_STATE_DELIVERABLE_GATES = 'fourspm_grid_deliverable_gates_state';
export const GRID_STATE_VARIATIONS = 'fourspm_grid_variations_state';
export const GRID_STATE_PROGRESS = 'fourspm_grid_progress_state';

// Context-specific grid state keys (for pages that appear in different contexts)
export const getProjectSpecificStateKey = (pageName: string, projectId: string): string => {
  return `fourspm_grid_project_${projectId}_${pageName}_state`;
};

// Helper function to create a standardized state key
export const createStateKey = (featureName: string, context?: string): string => {
  const base = `fourspm_grid_${featureName.toLowerCase()}`;
  return context ? `${base}_${context}_state` : `${base}_state`;
};
