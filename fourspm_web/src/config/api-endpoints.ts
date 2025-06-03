import { API_CONFIG } from './api';

export const LOGIN_ENDPOINT = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.login}`;
export const LOGOUT_ENDPOINT = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.logout}`;
export const REGISTER_ENDPOINT = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.register}`;
export const CREATE_USER_ENDPOINT = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.create}`;
export const RESET_PASSWORD_ENDPOINT = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.resetPassword}`;
export const CHANGE_PASSWORD_ENDPOINT = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.changePassword}`;

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
export const CURRENT_USER_PERMISSIONS_ENDPOINT = `${API_CONFIG.baseUrl}/odata/v1/Roles/GetCurrentUserPermissions`;
export const ROLE_PERMISSIONS_BY_NAME_ENDPOINT = `${API_CONFIG.baseUrl}/odata/v1/Roles/GetPermissionsByRoleName`;

export const getVariationDeliverablesEndpoint = (variationGuid: string): string => {
  return `${VARIATION_DELIVERABLES_ENDPOINT}?$filter=variationGuid eq ${variationGuid}`;
};


export const getDeliverablesWithProgressUrl = (projectId: string, period: number): string => {
  return `${DELIVERABLES_ENDPOINT}/GetWithProgressPercentages(projectGuid=${projectId},period=${period})`;
};


export const getDeliverablesByVariationUrl = (variationGuid: string): string => {
  return `${VARIATION_DELIVERABLES_ENDPOINT}?$filter=variationGuid eq ${variationGuid}`;
};


export const getVariationDeliverablesWithParamUrl = (variationGuid: string): string => {
  return `${VARIATION_DELIVERABLES_ENDPOINT}?variationId=${variationGuid}`;
};

export const getCancelDeliverableUrl = (originalDeliverableGuid: string, variationGuid: string): string => {
  return `${VARIATION_DELIVERABLES_ENDPOINT}/CancelDeliverable?originalDeliverableGuid=${originalDeliverableGuid}&variationGuid=${variationGuid}`;
};
