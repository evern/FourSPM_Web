import { AccountInfo, AuthenticationResult } from '@azure/msal-browser';

/**
 * Auth state interface following the application's Context+Reducer pattern
 */
export interface AuthState {
  isAuthenticated: boolean;
  account: AccountInfo | null;
  isLoading: boolean;
  error: string | null;
  accessToken: string | null;
}

/**
 * Auth action types for the reducer
 */
export enum AuthActionType {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  LOGOUT = 'LOGOUT',
  SET_LOADING = 'SET_LOADING',
  SET_ERROR = 'SET_ERROR',
  SET_TOKEN = 'SET_TOKEN',
  CLEAR_ERROR = 'CLEAR_ERROR'
}

/**
 * Auth action interfaces for the reducer
 */
type LoginSuccessAction = {
  type: AuthActionType.LOGIN_SUCCESS;
  payload: AccountInfo;
};

type LoginFailureAction = {
  type: AuthActionType.LOGIN_FAILURE;
  payload: string;
};

type LogoutAction = {
  type: AuthActionType.LOGOUT;
};

type SetLoadingAction = {
  type: AuthActionType.SET_LOADING;
  payload: boolean;
};

type SetErrorAction = {
  type: AuthActionType.SET_ERROR;
  payload: string;
};

type SetTokenAction = {
  type: AuthActionType.SET_TOKEN;
  payload: string;
};

type ClearErrorAction = {
  type: AuthActionType.CLEAR_ERROR;
};

/**
 * Auth action union type
 */
export type AuthAction =
  | LoginSuccessAction
  | LoginFailureAction
  | LogoutAction
  | SetLoadingAction
  | SetErrorAction
  | SetTokenAction
  | ClearErrorAction;

/**
 * Auth context interface
 */
export interface AuthContextType {
  state: AuthState;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  acquireToken: () => Promise<AuthenticationResult | null>;
  getAccessToken: () => string | null;
  clearError: () => void;
}
