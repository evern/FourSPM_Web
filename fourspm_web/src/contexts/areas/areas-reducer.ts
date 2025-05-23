import { AreasState, AreasAction, initialAreasState } from './areas-types';

/**
 * Reducer for the areas context
 * Handles state updates based on dispatched actions
 */
export function areasReducer(
  state: AreasState,
  action: AreasAction
): AreasState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_DATA_LOADED':
      return { ...state, dataLoaded: action.payload };
    // Token management removed for Optimized Direct Access pattern
    case 'SET_NEXT_AREA_NUMBER':
      return { ...state, nextAreaNumber: action.payload };
    default:
      return state;
  }
}
