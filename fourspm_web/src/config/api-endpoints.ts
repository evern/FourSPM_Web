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
export const ROLES_ENDPOINT = `${API_CONFIG.baseUrl}/odata/v1/Roles`;
export const VARIATION_DELIVERABLES_ENDPOINT = `${API_CONFIG.baseUrl}/odata/v1/VariationDeliverables`;
export const STATIC_PERMISSIONS_ENDPOINT = `${API_CONFIG.baseUrl}/odata/v1/StaticPermissions`;
export const ROLE_PERMISSIONS_ENDPOINT = `${API_CONFIG.baseUrl}/odata/v1/RolePermissions`;

// User permissions endpoints
export const CURRENT_USER_PERMISSIONS_ENDPOINT = `${API_CONFIG.baseUrl}/odata/v1/Roles/GetCurrentUserPermissions`;
export const ROLE_PERMISSIONS_BY_NAME_ENDPOINT = `${API_CONFIG.baseUrl}/odata/v1/Roles/GetPermissionsByRoleName`;

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
 * Returns the endpoint URL for getting deliverables by variation ID
 * @param variationGuid The GUID of the variation
 * @returns URL to the VariationDeliverables endpoint with filter
 */
export const getVariationDeliverablesEndpoint = (variationGuid: string): string => {
  // Using the dedicated VariationDeliverables endpoint with OData filter for variationGuid
  return `${VARIATION_DELIVERABLES_ENDPOINT}?$filter=variationGuid eq ${variationGuid}`;
};

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

/**
 * Generate the URL for retrieving deliverables associated with a specific variation using filter approach
 * @param variationGuid The GUID of the variation
 * @returns URL to the VariationDeliverables endpoint with filter for retrieving variation deliverables
 */
export const getDeliverablesByVariationUrl = (variationGuid: string): string => {
  // Using the new dedicated VariationDeliverables endpoint
  // IMPORTANT: GUID values must be formatted as guid'value' for OData v4 filtering
  return `${VARIATION_DELIVERABLES_ENDPOINT}?$filter=variationGuid eq ${variationGuid}`;
};

/**
 * Generate the URL for retrieving deliverables associated with a specific variation
 * @param variationGuid The GUID of the variation
 * @returns URL to the VariationDeliverables endpoint with variation parameter
 * @description This uses the consolidated endpoint approach where variationId is passed as a parameter directly to the endpoint
 * This allows the backend to include both variation deliverables and eligible original deliverables
 */
export const getVariationDeliverablesWithParamUrl = (variationGuid: string): string => {
  // Passing variationId directly as a query parameter to match the controller signature
  // When variationId is provided, the endpoint returns both variation deliverables and eligible original deliverables

  return `${VARIATION_DELIVERABLES_ENDPOINT}?variationId=${variationGuid}`;
};

// NOTE: The GetMergedVariationDeliverables function endpoint has been consolidated into the main endpoint
// Use getVariationDeliverablesWithParamUrl instead with the variationId parameter

/**
 * Generate the URL for cancelling a deliverable within a variation
 * @param originalDeliverableGuid The GUID of the original deliverable to cancel
 * @param variationGuid The GUID of the variation this cancellation belongs to
 * @returns URL to the action endpoint for cancelling a deliverable
 */
export const getCancelDeliverableUrl = (originalDeliverableGuid: string, variationGuid: string): string => {
  // Using OData function call format to cancel a deliverable
  return `${VARIATION_DELIVERABLES_ENDPOINT}/CancelDeliverable(originalDeliverableGuid=${originalDeliverableGuid},variationGuid=${variationGuid})`;
};
