/**
 * API endpoint path constants
 */
import { API_CONFIG } from './api';
import { createProjectFilter } from '../utils/odata-filters';

// Authentication endpoints
export const LOGIN_ENDPOINT = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.login}`;
export const LOGOUT_ENDPOINT = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.logout}`;
export const REGISTER_ENDPOINT = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.register}`;
export const CREATE_USER_ENDPOINT = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.create}`;
export const RESET_PASSWORD_ENDPOINT = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.resetPassword}`;
export const CHANGE_PASSWORD_ENDPOINT = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.changePassword}`;

// Fully qualified OData endpoints with base URL
export const PROJECTS_ENDPOINT = `${API_CONFIG.baseUrl}/odata/v1/Projects`;
export const DELIVERABLES_ENDPOINT = `${API_CONFIG.baseUrl}/odata/v1/Deliverables`;
export const AREAS_ENDPOINT = `${API_CONFIG.baseUrl}/odata/v1/Areas`;
export const CLIENTS_ENDPOINT = `${API_CONFIG.baseUrl}/odata/v1/Clients`;
export const DISCIPLINES_ENDPOINT = `${API_CONFIG.baseUrl}/odata/v1/Disciplines`;
export const DOCUMENT_TYPES_ENDPOINT = `${API_CONFIG.baseUrl}/odata/v1/DocumentTypes`;
export const DELIVERABLE_GATES_ENDPOINT = `${API_CONFIG.baseUrl}/odata/v1/DeliverableGates`;
export const PROGRESS_ENDPOINT = `${API_CONFIG.baseUrl}/odata/v1/Progress`;
export const DELIVERABLES_WITH_PROGRESS_ENDPOINT = `${API_CONFIG.baseUrl}/odata/v1/Deliverables/GetWithProgressPercentages`;

/**
 * Generate the OData query for deliverables with progress data for a specific project and period
 * @param projectId The project GUID
 * @param period The reporting period
 * @returns OData query string for filtering and expanding progress items
 */
export const getDeliverablesWithProgressQuery = (projectId: string, period: number): string => {
  const baseFilter = createProjectFilter(projectId) + " and deleted eq null";
  return `$filter=${baseFilter}&$expand=progressItems($filter=period eq ${period} and deleted eq null)`;
};

/**
 * Generate the full URL for the deliverables with progress endpoint for a specific project and period
 * @param projectId The project GUID
 * @param period The reporting period
 * @returns Full URL with query parameters
 */
export const getDeliverablesWithProgressUrl = (projectId: string, period: number): string => {
  return `${DELIVERABLES_WITH_PROGRESS_ENDPOINT}?projectGuid=${projectId}&period=${period}`;
};
