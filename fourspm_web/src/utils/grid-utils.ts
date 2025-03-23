/**
 * Extracts a value from row data retrieved from the DevExtreme DataGrid store
 * Handles various possible data structures returned from OData sources
 * @param responseData - The data returned from the store
 * @param fieldName - The name of the field to extract
 * @param defaultValue - Default value to use if the field is not found
 * @returns The extracted value or the default value
 */
export const extractRowValue = (responseData: any, fieldName: string, defaultValue: any) => {
  // Handle array response format
  if (Array.isArray(responseData) && responseData.length > 0) {
    const item = responseData[0];
    // Check for OData format with value property
    if (item.value && item.value[fieldName] !== undefined) {
      return item.value[fieldName] || defaultValue;
    }
    // Direct access
    return item[fieldName] !== undefined ? item[fieldName] : defaultValue;
  }
  
  // Handle object response format
  // Check for OData format with value property
  if (responseData.value && responseData.value[fieldName] !== undefined) {
    return responseData.value[fieldName] || defaultValue;
  }
  
  // Direct access
  return responseData[fieldName] !== undefined ? responseData[fieldName] : defaultValue;
};
