/**
 * Utility functions for working with GUIDs
 */

/**
 * Extracts a GUID string value from either a string or object representation
 * Handles various object formats that might contain GUID values
 * @param guidObj The GUID as string or object
 * @returns The extracted GUID string or the original value if extraction fails
 */
export const extractGuidValue = (guidObj: any): any => {
  if (typeof guidObj === 'string') {
    return guidObj; // Already a string, just return it
  } else if (guidObj && typeof guidObj === 'object') {
    // Try various common properties for GUID objects
    if (guidObj.valueOf && typeof guidObj.valueOf === 'function') {
      const value = guidObj.valueOf();
      if (typeof value === 'string') return value;
    }
    
    if (guidObj.toString && typeof guidObj.toString === 'function') {
      const str = guidObj.toString();
      // Only return if it looks like a GUID
      if (typeof str === 'string' && (str.includes('-') || str.length > 30)) {
        return str;
      }
    }
    
    // Try common property names for GUID objects
    for (const prop of ['value', 'guid', 'id', 'key']) {
      if (guidObj[prop] && typeof guidObj[prop] === 'string') {
        return guidObj[prop];
      }
    }
  }
  
  // If all else fails, try stringifying the object
  try {
    const str = JSON.stringify(guidObj);
    // Extract anything that looks like a GUID
    const guidMatch = str.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    if (guidMatch) return guidMatch[0];
  } catch (e) {}
  
  // Fall back to the original value if we couldn't extract anything
  return guidObj;
};

/**
 * Normalizes a GUID by converting to lowercase and removing non-alphanumeric characters
 * First extracts the GUID value if it's an object
 * @param guid The GUID to normalize (can be string or object)
 * @returns Normalized GUID string or the original value if normalization fails
 */
export const normalizeGuid = (guid: any): any => {
  const extractedGuid = extractGuidValue(guid);
  return typeof extractedGuid === 'string' ? extractedGuid.toLowerCase().replace(/[^a-z0-9]/g, '') : extractedGuid;
};

/**
 * Compares two GUIDs for equality, handling different formats
 * @param guid1 First GUID (string or object)
 * @param guid2 Second GUID (string or object)
 * @returns True if the GUIDs are equal after normalization
 */
export const compareGuids = (guid1: any, guid2: any): boolean => {
  const normalized1 = normalizeGuid(guid1);
  const normalized2 = normalizeGuid(guid2);
  
  return normalized1 === normalized2;
};
