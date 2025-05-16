import { AuthAction, AuthActionType, AuthState } from './auth-types';

// Initial auth state following FourSPM patterns
export const initialAuthState: AuthState = {
  isAuthenticated: false,
  account: null,
  isLoading: false,
  error: null,
  accessToken: null
};

/**
 * Auth reducer following the application's Context+Reducer pattern
 */
export const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case AuthActionType.LOGIN_SUCCESS:
      return {
        ...state,
        isAuthenticated: true,
        account: action.payload,
        isLoading: false,
        error: null
      };

    case AuthActionType.LOGIN_FAILURE:
      return {
        ...state,
        isAuthenticated: false,
        account: null,
        isLoading: false,
        error: action.payload,
        accessToken: null
      };

    case AuthActionType.LOGOUT:
      return {
        ...state,
        isAuthenticated: false,
        account: null,
        isLoading: false,
        error: null,
        accessToken: null
      };

    case AuthActionType.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };

    case AuthActionType.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };

    case AuthActionType.SET_TOKEN:
      return {
        ...state,
        accessToken: action.payload
      };

    case AuthActionType.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    default:
      return state;
  }
};
