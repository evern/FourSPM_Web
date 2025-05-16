# MSAL Integration Product Requirements Document

## 1. Introduction

This document outlines the comprehensive product requirements for integrating Microsoft Authentication Library (MSAL) with Single Sign-On (SSO) capabilities into the FourSPM React frontend application. The implementation will replace the current token-based authentication system while maintaining compatibility with the updated backend authorization system. This integration is critical for enhancing security, providing a seamless user experience, and ensuring compliance with modern authentication standards.

## 2. Product overview

FourSPM is a web-based project management application built with React and TypeScript. The application currently uses a custom token-based authentication system with form-based login. This product update focuses on migrating the authentication system to use Microsoft Authentication Library (MSAL) to enable Single Sign-On (SSO) through Azure Active Directory (Azure AD). 

The migration will include replacing the current authentication context, updating API integration to use MSAL tokens, implementing route protection based on user roles, creating a new login experience with Microsoft authentication, and developing administrative interfaces for role and permission management.

## 3. Goals and objectives

### 3.1 Primary goals

- Replace the current token-based authentication system with MSAL integration
- Enable Single Sign-On (SSO) capabilities through Azure Active Directory
- Maintain backward compatibility with existing application functionality
- Implement role-based access control using Azure AD roles and claims
- Provide administrative interfaces for role and permission management

### 3.2 Success metrics

- Successful authentication via Microsoft accounts for 100% of users
- Zero downtime during the authentication system transition
- Reduction in authentication-related support tickets by 75%
- Seamless integration with existing application features and API endpoints
- Complete role and permission management capabilities for administrators
- Consistent user experience across all authentication flows

## 4. Target audience

### 4.1 Primary users

- **Standard users**: Employees who need access to FourSPM for daily project management tasks
- **Administrative users**: System administrators who manage user access, roles, and permissions
- **IT security team**: Personnel responsible for maintaining security standards and compliance

### 4.2 User needs

- **Standard users**:
  - Simplified login process with SSO capabilities
  - Consistent access to required functionality based on assigned roles
  - Minimal disruption during the authentication system transition

- **Administrative users**:
  - Comprehensive interface for managing roles and permissions
  - Ability to assign and revoke permissions as needed
  - Clear visibility into the permission system and its impact on user access

- **IT security team**:
  - Enhanced security through modern authentication protocols
  - Ability to enforce organizational security policies
  - Centralized user management through Azure AD

## 5. Features and requirements

### 5.1 MSAL library integration

- Integrate MSAL libraries (`@azure/msal-browser` and `@azure/msal-react`) into the application
- Configure MSAL parameters based on environment settings
- Implement proper token caching and storage

### 5.2 Authentication context refactoring

- Replace the current `AuthProvider` with MSAL-based implementation
- Update `User` type to include roles from Azure AD claims
- Implement MSAL-based sign-in and sign-out functions
- Store authentication state in React context

### 5.3 API integration

- Update the base API service to include access tokens from MSAL
- Implement automatic token acquisition and refresh
- Handle authentication failures appropriately

### 5.4 Route protection

- Create a `RequireAuth` component to protect routes based on authentication status
- Implement permission-based access control for protected routes
- Redirect unauthenticated users to the login page
- Show appropriate error pages for unauthorized access attempts

### 5.5 Login experience

- Replace the current login form with MSAL login button
- Implement popup-based login experience
- Add silent authentication for returning users
- Provide comprehensive error handling for authentication failures

### 5.6 Role management

- Create administrative interface for viewing and managing roles
- Implement grid for viewing, adding, editing, and deleting roles
- Add navigation to permission management for each role

### 5.7 Permission management

- Create interface for assigning permissions to roles
- Display available permissions categorized by application area
- Implement permission update and save functionality
- Provide appropriate feedback for successful and failed operations

## 6. User stories and acceptance criteria

### 6.1 Authentication

#### ST-101: User login with Microsoft account
**As a** user,  
**I want to** log in using my Microsoft account,  
**So that** I can access the application without maintaining a separate set of credentials.

**Acceptance criteria:**
1. The login page displays a "Sign in with Microsoft" button
2. Clicking the button opens a Microsoft authentication popup
3. After successful authentication, the user is redirected to the application dashboard
4. User information (name, email) is displayed in the application header
5. The authentication token is properly stored and used for API requests

#### ST-102: Automatic authentication for returning users
**As a** returning user,  
**I want to** be automatically authenticated if I have an active session,  
**So that** I don't need to log in every time I access the application.

**Acceptance criteria:**
1. When a user with an active Microsoft session accesses the application, they are authenticated without interaction
2. A loading indicator is displayed during the silent authentication process
3. If silent authentication fails, the user is redirected to the login page
4. The user receives appropriate feedback about the authentication status

#### ST-103: User logout
**As a** logged-in user,  
**I want to** log out from the application,  
**So that** I can secure my session when I'm done using the application.

**Acceptance criteria:**
1. A logout option is available in the user menu
2. Clicking logout ends the user session with both the application and Microsoft
3. After logout, the user is redirected to the login page
4. User can no longer access protected routes without re-authentication

#### ST-104: Handle authentication errors
**As a** user experiencing authentication issues,  
**I want to** receive clear error messages,  
**So that** I understand what went wrong and how to resolve it.

**Acceptance criteria:**
1. Specific error messages are displayed for different authentication failure scenarios
2. Network failures are handled with appropriate retry logic
3. User-friendly language is used in error messages
4. Critical errors are logged for troubleshooting

### 6.2 Authorization

#### ST-201: Access control based on user roles
**As an** application administrator,  
**I want** access to features to be controlled by user roles,  
**So that** users only have access to the functionality they need for their job.

**Acceptance criteria:**
1. Routes are protected based on user roles retrieved from Azure AD
2. Users without the required role are redirected to an unauthorized page
3. Navigation items for unauthorized features are hidden from the UI
4. API requests include the proper authorization headers with role information

#### ST-202: View available roles
**As an** administrator,  
**I want to** view all available roles in the system,  
**So that** I can manage access control effectively.

**Acceptance criteria:**
1. A roles management page is accessible to administrators
2. The page displays a grid of all roles with their names and descriptions
3. The grid includes sorting and filtering capabilities
4. Role information is retrieved from the backend API

#### ST-203: Create new role
**As an** administrator,  
**I want to** create new roles,  
**So that** I can define custom access levels for different user groups.

**Acceptance criteria:**
1. An "Add" button is available on the roles management page
2. Clicking the button opens a form to enter role details
3. The form validates required fields and prevents duplicate role names
4. After successful creation, the role appears in the roles grid
5. Error messages are displayed if the role creation fails

#### ST-204: Edit existing role
**As an** administrator,  
**I want to** edit existing roles,  
**So that** I can update role information as needed.

**Acceptance criteria:**
1. An "Edit" button is available for each role in the grid
2. Clicking the button opens a form with the current role details
3. The form allows updating role name and description
4. After successful update, the changes are reflected in the grid
5. Error messages are displayed if the update fails

#### ST-205: Delete role
**As an** administrator,  
**I want to** delete roles that are no longer needed,  
**So that** I can maintain a clean and relevant role structure.

**Acceptance criteria:**
1. A "Delete" button is available for each role in the grid
2. Clicking the button prompts for confirmation
3. After confirmation, the role is removed from the system
4. The deleted role no longer appears in the grid
5. Error messages are displayed if the deletion fails

#### ST-206: Manage role permissions
**As an** administrator,  
**I want to** assign specific permissions to roles,  
**So that** I can control access at a granular level.

**Acceptance criteria:**
1. A "Permissions" button is available for each role in the grid
2. Clicking the button navigates to a permissions management page for the selected role
3. The page displays all available permissions categorized by application area
4. Current permissions assigned to the role are pre-selected
5. Changes can be saved, and appropriate feedback is provided

### 6.3 Database modeling

#### ST-301: Database schema for role-based access control
**As a** system architect,  
**I want** the database to store role and permission relationships,  
**So that** the backend can enforce access control based on user roles.

**Acceptance criteria:**
1. Database schema includes tables for roles, permissions, and their relationships
2. Schema supports retrieving all permissions for a given role
3. Schema allows storing custom roles specific to the application
4. Data model supports efficient queries for authorization checks

### 6.4 Edge cases

#### ST-401: Handle expired tokens
**As a** user with an expired token,  
**I want** the application to automatically refresh my authentication,  
**So that** my workflow is not interrupted.

**Acceptance criteria:**
1. The application detects expired tokens before making API requests
2. Token refresh is attempted automatically without user interaction
3. If refresh fails, the user is prompted to re-authenticate
4. A loading indicator is displayed during the token refresh process

#### ST-402: Handle network disconnection
**As a** user experiencing network issues,  
**I want** the application to handle authentication gracefully,  
**So that** I can continue working when the connection is restored.

**Acceptance criteria:**
1. Authentication failures due to network issues are detected
2. Retry logic is implemented for token acquisition
3. User is informed about the network issue
4. Authentication is automatically retried when the network is available again

#### ST-403: Handle permission changes
**As a** user whose permissions have changed,  
**I want** these changes to be reflected in my session,  
**So that** I don't need to log out and log in again.

**Acceptance criteria:**
1. Permission changes are detected during token refresh
2. UI updates to reflect new permissions without requiring re-login
3. Access to newly authorized routes is granted immediately
4. Access to newly unauthorized routes is revoked immediately

## 7. Technical requirements / stack

### 7.1 Frontend technologies

- **Framework**: React 18.2.0 with TypeScript 4.9.5
- **Authentication**: Microsoft Authentication Library (MSAL)
  - `@azure/msal-browser`: Core MSAL functionality
  - `@azure/msal-react`: React components and hooks
- **UI Components**: DevExtreme 23.1.3
- **State Management**: React Context API with useReducer
- **API Communication**: Fetch API with OData 4.0
- **Build Tool**: Create React App (or existing build configuration)

### 7.2 Backend integration

- **API Endpoints**: REST API with OData 4.0 support
- **Authentication**: JWT tokens issued by Azure AD
- **Authorization**: Role-based access control using claims

### 7.3 External services

- **Identity Provider**: Azure Active Directory (Azure AD)
  - Application (client) ID: c67bf91d-8b6a-494a-8b99-c7a4592e08c1
  - Directory (tenant) ID: 3c7fa9e9-64e7-443c-905a-d9134ca00da9

### 7.4 Environment configuration

- Environment-specific configuration files:
  - `.env.development`
  - `.env.production`
- Configuration parameters:
  - REACT_APP_ENVIRONMENT
  - REACT_APP_AZURE_CLIENT_ID
  - REACT_APP_AZURE_TENANT_ID

## 8. Design and user interface

### 8.1 Login page

- Clean, minimalist design focusing on the Microsoft login button
- FourSPM logo and branding
- Brief explanatory text about the SSO login process
- Responsive design for all device sizes

### 8.2 Role management interface

- Grid-based interface for viewing and managing roles
- Consistent with existing application design patterns
- Column configuration:
  - Role name
  - Description
  - Created date
  - Last modified date
  - Actions (edit, delete, manage permissions)
- Standard CRUD operations (Create, Read, Update, Delete)
- Permission management button for each role

### 8.3 Permission management interface

- Categorized list of available permissions
- Checkboxes for selecting/deselecting permissions
- Clear visual indication of selected permissions
- Save and cancel buttons
- Feedback messages for successful/failed operations

### 8.4 Error states

- User-friendly error messages for authentication failures
- Consistent styling for error notifications
- Non-intrusive toast messages for transient errors
- Modal dialogs for critical errors requiring user action

### 8.5 Loading states

- Consistent loading indicators throughout the authentication flow
- Non-blocking loading indicators where possible
- Clear visual feedback during authentication processes
