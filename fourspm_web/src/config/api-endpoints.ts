/**
 * API endpoint path constants
 */
import { API_CONFIG } from './api';

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
export const VARIATIONS_ENDPOINT = `${API_CONFIG.baseUrl}/odata/v1/Variations`;

/**
 * Note on OData Custom Function Endpoints:
 * 
 * Example code for custom OData function endpoints is commented out below.
 * This demonstrates how to define and use OData function endpoints with query parameters.
 * 
 * For reference, standard OData function calls require empty parentheses when no parameters are used:
 * - Function without params: `/odata/v1/Deliverables/GetWithProgressPercentages()?$filter=...`
 * - Function with params: `/odata/v1/Deliverables/GetWithProgressPercentages(projectGuid=guid,period=0)?$filter=...`
 */

/**
 * Generate the full URL for the deliverables with progress endpoint for a specific project and period
 * @param projectId The project GUID
 * @param period The reporting period
 * @returns Full URL with OData function call format for the GetWithProgressPercentages endpoint
 */
export const getDeliverablesWithProgressUrl = (projectId: string, period: number): string => {
  // Using OData function call format with parameters  
  return `${DELIVERABLES_ENDPOINT}/GetWithProgressPercentages(projectGuid=${projectId},period=${period})`;
};
