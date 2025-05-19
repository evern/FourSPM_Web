# MSAL Authentication Implementation Requirements

## Overview
This document outlines the requirements for implementing Microsoft Authentication Library (MSAL) in the FourSPM Web application, replacing the current legacy authentication system. The backend already supports both authentication methods through a combined authentication handler.

## Business Requirements

### Authentication Flow
1. Replace the current email/password login form with a single Microsoft login button
2. Implement silent token refresh to maintain user sessions
3. Support sign-out functionality that clears local state and MSAL cache
4. Handle authentication errors and network issues gracefully
5. Support role-based access control using Azure AD groups or roles

### User Experience
1. Provide a clean, modern login screen with Microsoft branding
2. Minimize login friction with a single-click authentication process
3. Ensure seamless token refresh without user interaction
4. Display appropriate loading states during authentication processes
5. Support both popup and redirect authentication flows (with popup as default)

## Technical Requirements

### MSAL Configuration
1. Register the FourSPM Web application in Azure AD
2. Configure the following MSAL settings:
   - Client ID (Application ID)
   - Authority URL (tenant-specific or common)
   - Redirect URI
   - Scopes required for API access
3. Configure silent authentication with appropriate cache handling

### Authentication Context
1. Create an MSALAuthProvider component that:
   - Initializes the MSAL instance
   - Handles login, logout, and token acquisition
   - Manages token caching and renewal
   - Interfaces with the FourSPM API using acquired tokens
   
2. Implement dual-context support:
   - Maintain the current AuthProvider for legacy authentication
   - Create a new MSALAuthProvider for MSAL authentication
   - Provide a mechanism to switch between the two providers
   
3. User data mapping:
   - Map MSAL account/claims to the User interface expected by the application
   - Extract user profile information (name, email, avatar)
   - Extract and store the access token for API calls
   - Obtain user roles/claims for authorization

### API Integration
1. Update API service to use MSAL tokens for authenticated requests
2. Handle token acquisition and renewal before API calls
3. Implement token caching to minimize authentication requests

### Error Handling
1. Handle common MSAL errors:
   - User cancellation
   - Network failures
   - Token expiration
   - Insufficient permissions
2. Provide clear error messages and recovery paths for users

## Implementation Strategy

### Phase 1: MSAL Integration
1. Add MSAL library dependency
2. Create MSALAuthContext and Provider components
3. Implement basic login/logout functionality
4. Map MSAL user data to application User interface

### Phase 2: Login UI Update
1. Create a new login page with Microsoft login button
2. Implement login popup/redirect flow
3. Add loading states and error handling
4. Test authentication flow end-to-end

### Phase 3: API Integration
1. Update API services to use MSAL tokens
2. Implement interceptors for token renewal
3. Test API authorization with MSAL tokens
4. Verify token refresh mechanism

### Phase 4: Transition Strategy
1. Implement a feature flag to switch between authentication methods
2. Test compatibility with existing features
3. Create migration path for existing users
4. Roll out MSAL authentication to production

## Testing Requirements
1. Verify login with different account types (personal, work/school)
2. Test silent token refresh scenarios
3. Validate proper error handling for various failure cases
4. Test authorization with different user roles
5. Verify API call authentication with MSAL tokens

## Dependencies
- @azure/msal-browser: "^2.32.0" or later
- @azure/msal-react: "^1.5.0" or later
- Existing React context architecture
- Backend support for MSAL tokens (already implemented)

## Azure AD Configuration Reference
- **Application Name**: FourSPM Web Application
- **Application (client) ID**: c67bf91d-8b6a-494a-8b99-c7a4592e08c1
- **Object ID**: eada507e-40e7-45fb-be77-bbf02c033b6
- **Directory (tenant) ID**: 3c7fa9ef-64e7-443c-905a-d9134ca004a9
- **Supported account types**: My organization only (single-tenant)
- **API Scopes**:
  - api://c67bf91d-8b6a-494a-8b99-c7a4592e08c1/Application.Admin (Admin access)
  - api://c67bf91d-8b6a-494a-8b99-c7a4592e08c1/Application.User (User access)
