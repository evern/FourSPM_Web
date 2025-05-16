/**
 * Generic OData entity adapter interface for converting between API and UI models
 * Following the FourSPM UI Development Guidelines for standardized adapters
 */

/**
 * Interface for adapters that convert between OData entities and UI models
 */
export interface ODataEntityAdapter<T> {
  /**
   * Converts an OData entity to a UI model
   * @param oDataEntity The OData entity from the API
   * @returns A UI model of type T
   */
  fromOData: (oDataEntity: any) => T;

  /**
   * Converts a UI model to an OData entity for API operations
   * @param model The UI model of type T
   * @returns An OData entity suitable for API operations
   */
  toOData: (model: T) => any;
}
