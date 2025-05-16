import { User } from '../types/auth-types';

/**
 * Authentication state for reducer
 */
export interface AuthState {
  user: User | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Initial authentication state
 */
export const initialAuthState: AuthState = {
  user: null,
  loading: true,
  error: null
};

/**
 * Authentication action types
 */
export enum AuthActionType {
  SET_USER = 'SET_USER',
  SET_LOADING = 'SET_LOADING',
  SET_ERROR = 'SET_ERROR',
  RESET = 'RESET'
}

/**
 * Authentication actions
 */
export type AuthAction = 
  | { type: AuthActionType.SET_USER; payload: User | null }
  | { type: AuthActionType.SET_LOADING; payload: boolean }
  | { type: AuthActionType.SET_ERROR; payload: Error | null }
  | { type: AuthActionType.RESET };

/**
 * Authentication reducer for handling auth state changes
 */
export function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case AuthActionType.SET_USER:
      return {
        ...state,
        user: action.payload,
        loading: false
      };
    case AuthActionType.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };
    case AuthActionType.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    case AuthActionType.RESET:
      return {
        ...initialAuthState,
        loading: false
      };
    default:
      return state;
  }
}
