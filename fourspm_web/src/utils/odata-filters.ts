/**
 * Utility functions for creating standardized OData filter expressions
 */

/**
 * Creates a filter expression for equality comparison
 * @param field Field name to filter on
 * @param value Value to compare against
 * @returns Filter expression string (without $filter= prefix)
 */
export const createEqualsFilter = (field: string, value: string): string => {
  // Enclose string values in single quotes
  const formattedValue = typeof value === 'string' ? `'${value}'` : value;
  return `${field} eq ${formattedValue}`;
};

/**
 * Creates a complete OData query parameter with filter
 * @param filterExpression Filter expression without $filter= prefix 
 * @returns Complete OData query parameter string with $filter= prefix
 */
export const createODataFilterParam = (filterExpression: string): string => {
  return filterExpression ? `$filter=${filterExpression}` : '';
};

/**
 * Creates an OData filter for matching a field to a project GUID
 * @param projectId Project GUID to filter by
 * @param fieldName Optional field name (defaults to 'projectGuid')
 * @returns Filter expression string (without $filter= prefix)
 */
export const createProjectFilter = (projectId: string, fieldName: string = 'projectGuid'): string => {
  // For project GUIDs, we can use them directly without quotes for ODataStore
  return `${fieldName} eq ${projectId}`;
};

/**
 * Creates a complete OData query parameter for project filtering 
 * @param projectId Project GUID to filter by
 * @param fieldName Optional field name (defaults to 'projectGuid')
 * @returns Complete OData query parameter string with $filter= prefix
 */
export const createProjectFilterParam = (projectId: string, fieldName: string = 'projectGuid'): string => {
  return createODataFilterParam(createProjectFilter(projectId, fieldName));
};
