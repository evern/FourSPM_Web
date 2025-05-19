# FOURSPM WEB MSAL AUTHENTICATION PRODUCT REQUIREMENTS DOCUMENT

## 1. Introduction

### 1.1 Purpose
This document outlines detailed requirements for implementing Microsoft Authentication Library (MSAL) in the FourSPM Web application. It serves as a comprehensive guide for development teams to replace the current legacy username/password authentication system with Azure AD authentication while maintaining backward compatibility.

### 1.2 Document scope
This PRD covers all aspects of the MSAL authentication implementation including technical requirements, user experience considerations, integration points with existing systems, and the implementation strategy. The project aims to enhance security, simplify the authentication experience, and leverage Azure AD for identity management.

### 1.3 Intended audience
- Development team
- Project managers
- UX/UI designers
- QA engineers
- Product stakeholders

## 2. Product overview

### 2.1 Background
FourSPM Web application currently uses a legacy authentication system with username and password. The backend has been upgraded to support both the legacy system and Azure AD authentication through a combined authentication handler that can dynamically select between schemes based on the token type.

### 2.2 Current system
The existing authentication system uses:
- Custom React context (AuthProvider) for authentication state management
- API-based username/password authentication
- Local token storage mechanism
- Manual token validation and refresh logic

### 2.3 Proposed changes
The new authentication system will:
- Implement Microsoft Authentication Library (MSAL) for Azure AD integration
- Replace username/password login with Microsoft single sign-on
- Support seamless token acquisition and renewal
- Provide backward compatibility with existing application features
- Leverage Azure AD security features and role-based access control

## 3. Goals and objectives

### 3.1 Primary goals
1. Implement secure, standards-based authentication using Microsoft identity platform
2. Simplify the login experience with single sign-on
3. Improve security posture by eliminating password storage and management
4. Enable role-based access control using Azure AD groups/roles
5. Maintain compatibility with existing application functionality

### 3.2 Success metrics
1. 100% of new users authenticate via Azure AD
2. Reduction in authentication-related support tickets by 80%
3. Zero security incidents related to authentication within 6 months of implementation
4. All application features maintain full functionality with new authentication system
5. Authentication token refresh operations succeed without user intervention in 99.9% of cases

## 4. Target audience

### 4.1 Primary users
- FourSPM application users within the organization
- System administrators who manage user access
- Department managers who require role-specific access

### 4.2 User characteristics
- Users are typically knowledge workers in engineering, project management, and administration
- Most users are already familiar with Microsoft authentication from other enterprise applications
- Users access the application from both desktop and mobile devices
- Users expect minimal disruption when switching between applications

### 4.3 User pain points addressed
- Eliminating the need to remember another username/password combination
- Reducing the frequency of login requests through longer session management
- Simplifying the login process with single-click authentication
- Providing clear error messages when authentication issues occur

## 5. Features and requirements

### 5.1 Authentication flow
1. Replace the current email/password login form with a single Microsoft login button
2. Implement silent token refresh to maintain user sessions
3. Support sign-out functionality that clears local state and MSAL cache
4. Handle authentication errors and network issues gracefully
5. Support role-based access control using Azure AD groups or roles

### 5.2 User experience
1. Provide a clean, modern login screen with Microsoft branding
2. Minimize login friction with a single-click authentication process
3. Ensure seamless token refresh without user interaction
4. Display appropriate loading states during authentication processes
5. Support both popup and redirect authentication flows (with popup as default)

### 5.3 Authentication context
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

### 5.4 API integration
1. Update API service to use MSAL tokens for authenticated requests
2. Handle token acquisition and renewal before API calls
3. Implement token caching to minimize authentication requests

### 5.5 Error handling
1. Handle common MSAL errors:
   - User cancellation
   - Network failures
   - Token expiration
   - Insufficient permissions
2. Provide clear error messages and recovery paths for users

## 6. User stories and acceptance criteria

### 6.1 Authentication

#### AUTH-101: As a user, I want to log in with my Microsoft account
**Acceptance criteria:**
- A Microsoft login button is displayed prominently on the login page
- Clicking the button opens the Microsoft authentication popup/redirect
- After successful authentication, I am logged into the application
- My user profile is populated with data from my Microsoft account
- I can access all features appropriate for my role

#### AUTH-102: As a user, I want to remain logged in across browser sessions
**Acceptance criteria:**
- After logging in, my authentication state persists when I close and reopen the browser
- Token refresh happens automatically without requiring user action
- If my token cannot be refreshed silently, I am prompted to authenticate again
- Login state is properly cleared when I explicitly log out

#### AUTH-103: As a user, I want to log out of the application
**Acceptance criteria:**
- A visible logout option is available in the user menu
- Clicking logout clears my authentication state from the application
- Logout also clears MSAL cache to prevent automatic re-authentication
- After logout, protected routes redirect to the login page

#### AUTH-104: As a user, I want to see appropriate error messages if login fails
**Acceptance criteria:**
- If I cancel the Microsoft authentication popup, the application shows an appropriate message
- Network failures during authentication display clear error messages
- Permission issues (e.g., unauthorized access) show clear explanations
- Each error message provides guidance on how to resolve the issue when possible

#### AUTH-105: As a system, I need to handle token expiration
**Acceptance criteria:**
- Before tokens expire, the system attempts silent token refresh
- If silent refresh fails, the user is prompted to re-authenticate
- API calls automatically use the most recent valid token
- Failed API calls due to token issues trigger authentication renewal

### 6.2 Authorization

#### AUTHZ-101: As an administrator, I want user roles to be determined by Azure AD
**Acceptance criteria:**
- User roles are extracted from Azure AD claims/groups
- Application permissions are granted based on these roles
- Role changes in Azure AD are reflected in the application after re-authentication
- The application validates roles on both client and server sides

#### AUTHZ-102: As a user, I want to access only the features appropriate for my role
**Acceptance criteria:**
- UI components are conditionally rendered based on user roles
- Attempting to access unauthorized features via direct URL results in appropriate error messages
- API endpoints validate authentication and authorization on the server side
- Role requirements are clearly communicated to users

### 6.3 Transition and compatibility

#### TRANS-101: As a system administrator, I want to enable a gradual transition to MSAL
**Acceptance criteria:**
- Feature flag exists to enable/disable MSAL authentication
- When enabled, login screen shows Microsoft authentication option
- Legacy authentication remains accessible during transition period (if needed)
- User preferences for authentication method are stored (if supporting both methods)

#### TRANS-102: As a developer, I need existing application functionality to work with MSAL
**Acceptance criteria:**
- All API calls work with MSAL tokens
- Existing features function correctly with the new authentication mechanism
- User context data structure remains compatible with existing components
- Performance metrics remain within acceptable thresholds

## 7. Technical requirements / stack

### 7.1 Frontend technologies
- React 18.2.0
- TypeScript 4.9.5
- @azure/msal-browser (v2.32.0+)
- @azure/msal-react (v1.5.0+)
- DevExtreme 23.1.3 (for UI components)

### 7.2 MSAL configuration requirements
- Application registration in Azure AD
- Configuration parameters:
  - Application (client) ID: c67bf91d-8b6a-494a-8b99-c7a4592e08c1
  - Directory (tenant) ID: 3c7fa9ef-64e7-443c-905a-d9134ca004a9
  - Object ID: eada507e-40e7-45fb-be77-bbf02c033b6
  - Redirect URI: Application root URL
  - Scopes:
    - api://c67bf91d-8b6a-494a-8b99-c7a4592e08c1/Application.Admin
    - api://c67bf91d-8b6a-494a-8b99-c7a4592e08c1/Application.User

### 7.3 Backend integration
- JWT token validation for MSAL tokens
- Support for dynamic authentication scheme selection:
  - Identify MSAL tokens by issuer (login.microsoftonline.com or sts.windows.net)
  - Route to appropriate authentication handler
- Configure proper CORS settings for Azure AD redirects

### 7.4 Security requirements
- Store tokens securely using recommended browser storage patterns
- Implement appropriate token lifetime management
- Apply principle of least privilege for scope requests
- Follow Microsoft identity platform best practices

## 8. Design and user interface

### 8.1 Login screen
- Clean, modern interface with the FourSPM branding
- Prominent Microsoft login button with Microsoft logo
- Clear instructions for users
- Appropriate loading indicators during authentication
- Accessible design meeting WCAG standards

### 8.2 Error states
- User-friendly error messages for common authentication issues
- Guidance for resolving authentication problems
- Contact information for support when automated resolution isn't possible

### 8.3 User profile integration
- Display user information from Microsoft account (name, email)
- Optional: Display user profile picture from Microsoft account
- Show current authentication status in the application header

### 8.4 Login flow
- Primary: Popup-based authentication (less disruptive to user experience)
- Fallback: Redirect-based authentication (for browsers that block popups)
- Silent authentication for token refresh (no UI when possible)

### 8.5 Responsive considerations
- Login UI adapts to both desktop and mobile viewports
- Authentication flow works consistently across devices
- Touch-friendly targets for mobile users

### 8.6 Accessibility requirements
- All authentication UI elements must be fully keyboard accessible
- Screen reader compatibility for all authentication flows
- Sufficient color contrast for text and interactive elements
- Clear focus indicators for interactive elements

## 9. Implementation strategy

### 9.1 Phase 1: MSAL integration
1. Add MSAL library dependency
2. Create MSALAuthContext and Provider components
3. Implement basic login/logout functionality
4. Map MSAL user data to application User interface

### 9.2 Phase 2: Login UI update
1. Create a new login page with Microsoft login button
2. Implement login popup/redirect flow
3. Add loading states and error handling
4. Test authentication flow end-to-end

### 9.3 Phase 3: API integration
1. Update API services to use MSAL tokens
2. Implement interceptors for token renewal
3. Test API authorization with MSAL tokens
4. Verify token refresh mechanism

### 9.4 Phase 4: Transition strategy
1. Implement a feature flag to switch between authentication methods
2. Test compatibility with existing features
3. Create migration path for existing users
4. Roll out MSAL authentication to production

### 9.5 Testing requirements
1. Verify login with different account types (personal, work/school)
2. Test silent token refresh scenarios
3. Validate proper error handling for various failure cases
4. Test authorization with different user roles
5. Verify API call authentication with MSAL tokens

## 10. Dependencies and constraints

### 10.1 External dependencies
- Azure AD tenant configuration
- Microsoft identity platform services availability
- Backend support for MSAL tokens (already implemented)

### 10.2 Internal dependencies
- React context architecture
- API services implementation
- Application routing system

### 10.3 Constraints
- Maintain backward compatibility with existing features
- Minimize disruption to current users
- Follow established DevExtreme and React patterns
- Meet all security requirements for enterprise authentication
