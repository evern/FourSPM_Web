# Azure AD Authentication Implementation Guide for FourSPM_Web

This document outlines the steps and architecture for implementing Azure AD authentication in the FourSPM_Web application, based on the implementation in the Blueprints project.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Azure AD Configuration](#azure-ad-configuration)
3. [Frontend Implementation (FourSPM_Web)](#frontend-implementation-fourspm_web)
4. [Backend Implementation (FourSPM_WebService)](#backend-implementation-fourspm_webservice)
5. [Implementation Steps](#implementation-steps)
6. [Troubleshooting](#troubleshooting)

## Architecture Overview

The authentication system uses the following architecture:

```
┌───────────────────┐     ┌───────────────────┐     ┌───────────────────┐
│                   │     │                   │     │                   │
│  FourSPM_Web      │     │  Azure Active     │     │  FourSPM_WebService│
│  (React)          │◄────►  Directory        │◄────►  (ASP.NET Core)    │
│                   │     │                   │     │                   │
└───────────────────┘     └───────────────────┘     └───────────────────┘
      │      ▲                                            │      ▲
      │      │                                            │      │
      │      │                                            │      │
      ▼      │                                            ▼      │
┌───────────────────┐                              ┌───────────────────┐
│                   │                              │                   │
│  MSAL Library     │                              │ Microsoft.Identity.│
│  (Authentication) │                              │ Web (Validation)   │
│                   │                              │                   │
└───────────────────┘                              └───────────────────┘
```

### Authentication Flow:

1. User attempts to access a protected resource in FourSPM_Web
2. MSAL library redirects to Azure AD login page
3. User authenticates with Azure AD credentials
4. Azure AD returns tokens to the application
5. Application uses tokens to make authenticated API requests to FourSPM_WebService
6. FourSPM_WebService validates the token using Microsoft.Identity.Web
7. Authorized data is returned to FourSPM_Web

## Azure AD Configuration

### Application Registration

You can use a single application registration in Azure AD for both the frontend and backend:

**FourSPM Web Application (Combined):**

1. **Frontend Configuration:**
   - Type: Single-page application (SPA)
   - Redirect URIs: 
     * `http://localhost:3000` (development)
     * `https://app.4spm.org` (production)
   
2. **API Configuration (same registration):**
   - Expose an API: Set Application ID URI to `api://{clientId}`
   - Add scopes:
     * `Application.User` - Standard user access
     * `Application.Admin` - Administrative access
   
3. **API Permissions:**
   - Add permission to your own API
   - Select the `Application.User` and `Application.Admin` scopes
   - Grant admin consent

## Frontend Implementation (FourSPM_Web)

### Key Files

1. **MSAL Configuration (`src/config/msal-config.ts`):**
   - Defines authentication parameters and scopes
   - Configures cache storage and authority

2. **MSAL Instance (`src/contexts/auth/msal-instance.ts`):**
   - Creates and initializes the MSAL instance
   - Tracks initialization state

3. **Auth Provider (`src/contexts/auth/auth-provider.tsx`):**
   - React context for authentication state
   - Provides sign-in and sign-out functions
   - Handles token validation and refresh

4. **Auth Utils (`src/contexts/auth/auth-utils.ts`):**
   - Token acquisition helpers
   - Scope verification functions
   - Role checking functions

5. **Auth API Service (`src/api/auth-api.service.ts`):**
   - Interfaces with MSAL for authentication operations
   - Handles user profile retrieval and token validation
   - Creates user objects from authentication responses

6. **Authorization Hook (`src/contexts/auth/useAuthorization.ts`):**
   - Verifies user permissions
   - Provides role-based access control functions

### Key Components

#### MSAL Configuration
```typescript
import { Configuration } from '@azure/msal-browser';

export const msalConfig: Configuration = {
  auth: {
    clientId: 'YOUR_CLIENT_ID',
    authority: 'https://login.microsoftonline.com/YOUR_TENANT_ID',
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
  // Additional system settings
};

export const apiScopes = {
  fourSpmApi: ['api://YOUR_APPLICATION_CLIENT_ID/Application.User'],
  adminApi: ['api://YOUR_APPLICATION_CLIENT_ID/Application.Admin']
};
```

#### Auth Provider
```typescript
function AuthProvider({ children }) {
  const [user, setUser] = useState();
  const [loading, setLoading] = useState(true);

  // User validation function
  const validateUser = useCallback(async () => {
    // Implementation
  }, []);

  // Initialize and handle token refresh
  useEffect(() => {
    // Implementation
  }, []);

  // Sign in function
  const signIn = useCallback(async () => {
    // Implementation
  }, []);

  // Sign out function
  const signOut = useCallback(async () => {
    // Implementation
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
```

## Backend Implementation (FourSPM_WebService)

### Key Components

1. **Authentication Configuration (`Program.cs`):**
   - Adds Microsoft.Identity.Web for token validation
   - Configures JWT Bearer authentication

2. **Application Settings (`appsettings.json`):**
   - Azure AD tenant and client configuration
   - API permissions and scopes

3. **CORS Configuration:**
   - Allows requests from the frontend application
   - Configures proper headers for authentication

### Example Implementation

#### Program.cs (Authentication Setup)
```csharp
// Add authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApi(builder.Configuration.GetSection("AzureAd"));

// Set the NameClaimType for JWT tokens
builder.Services.Configure<JwtBearerOptions>(
    JwtBearerDefaults.AuthenticationScheme, 
    options => {
        options.TokenValidationParameters.NameClaimType = "name";
    });

// Add CORS policy
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
                "http://localhost:3000",
                "https://app.4spm.org")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Later in the request pipeline
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
```

#### appsettings.json
```json
{
  "AzureAd": {
    "Instance": "https://login.microsoftonline.com/",
    "TenantId": "YOUR_TENANT_ID",
    "ClientId": "YOUR_APPLICATION_CLIENT_ID", // Same ID as frontend
    "Audience": "api://YOUR_APPLICATION_CLIENT_ID", // Same Application ID URI
    "CallbackPath": "/signin-oidc"
  }
}
```

## Implementation Steps

### 1. Azure AD Configuration

1. **Register Application:**
   - Log in to [Azure Portal](https://portal.azure.com)
   - Go to Azure Active Directory > App registrations > New registration
   - Name: "FourSPM Web Application"
   - Supported account types: Accounts in this organizational directory only
   - Redirect URI: Add both development and production URLs as Single-page application
     * `http://localhost:3000`
     * `https://app.4spm.org`
   - Click "Register" and note the Application (client) ID

2. **Configure Authentication:**
   - Go to "Authentication" in the left sidebar
   - Under "Implicit grant and hybrid flows", check:
     * Access tokens
     * ID tokens
   - Save changes

3. **Expose an API:**
   - Go to "Expose an API" in the left sidebar
   - Set Application ID URI (typically `api://{clientId}`)
   - Add the following scopes:
     * `Application.User` (User-level access)
     * `Application.Admin` (Admin-level access)

4. **Configure API Permissions (Self-Permissions):**
   - Go to "API permissions" in the left sidebar
   - Click "Add a permission"
   - Select "My APIs"
   - Select your own application ("FourSPM Web Application")
   - Select the appropriate scopes (Application.User and/or Application.Admin)
   - Grant admin consent if needed

### 2. Frontend Implementation

1. **Install Required Packages:**
   ```bash
   npm install @azure/msal-browser @azure/msal-react
   ```

2. **Create MSAL Configuration:**
   - Create `src/config/msal-config.ts` with your Azure AD settings
   - Define security scopes and API permissions

3. **Create Authentication Service:**
   - Implement auth-provider.tsx with context and hooks
   - Create msal-instance.ts for MSAL initialization
   - Implement auth-utils.ts for token and permission helpers

4. **Update API Service:**
   - Modify base-api.service.ts to include access tokens in requests
   - Implement token acquisition and refresh logic

5. **Add Authentication to App:**
   - Wrap your application in the AuthProvider
   - Add login/logout UI components
   - Implement protected routes using the useAuthorization hook

### 3. Backend Implementation

1. **Install Required Packages:**
   ```bash
   dotnet add package Microsoft.Identity.Web
   ```

2. **Update Configuration:**
   - Add Azure AD section to appsettings.json
   - Configure your TenantId and ClientId

3. **Configure Authentication:**
   - Update Program.cs with JwtBearer and Microsoft.Identity.Web
   - Configure CORS for your frontend domains
   - Add authentication middleware to the pipeline

4. **Add Authorization to Controllers:**
   - Add [Authorize] attributes to protected endpoints
   - Implement role-based authorization with specific policies

## Troubleshooting

### Common Issues and Solutions

1. **Invalid Client Error:**
   - Verify the clientId in your MSAL configuration
   - Ensure the redirect URI is registered in Azure AD
   - Check that the application is properly consented

2. **Token Acquisition Failures:**
   - Check browser console for MSAL errors
   - Verify scopes are correctly configured
   - Check for interaction_in_progress errors (sign-out may be required)

3. **Unauthorized API Access:**
   - Verify token is being sent in the Authorization header
   - Check that API permissions are granted and consented
   - Validate that the token contains the required scopes

4. **CORS Issues:**
   - Ensure CORS is configured correctly in the backend
   - Verify that the frontend origin exactly matches the allowed origins
   - Check for missing Access-Control-Allow-* headers

5. **Authentication Flow Errors:**
   - For popup issues, try redirect flow instead
   - Clear browser cache and cookies
   - Check for browser popup blockers

### Debug Logging

1. **Enable MSAL Logging:**
   ```typescript
   const msalConfig = {
     system: {
       loggerOptions: {
         logLevel: LogLevel.Verbose,
         // Additional log options
       }
     }
   };
   ```

2. **Enable JWT Debugging (Backend):**
   ```csharp
   services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
       .AddJwtBearer(options => {
           options.Events = new JwtBearerEvents {
               OnTokenValidated = context => {
                   // Log token validation
                   return Task.CompletedTask;
               }
           };
       });
   ```
