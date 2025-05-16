# Environment Configuration Guide

## Overview

This document describes the environment-specific configuration for the FourSPM application. The application supports multiple environments, including:

- Development
- Test
- Staging
- Production

## Environment Variables

The following environment variables can be set in your `.env` file or in your deployment environment:

### Required Variables

```
# Environment type (development, test, staging, production)
REACT_APP_ENVIRONMENT=development

# API URL override (optional, will use default from environment.ts if not provided)
REACT_APP_API_URL=https://localhost:7246

# Azure AD tenant ID
REACT_APP_AUTH_TENANT=3c7fa9e9-64e7-443c-905a-d9134ca00da9

# Azure AD client ID
REACT_APP_CLIENT_ID=dc67b914-88aa-494a-8b99-c7af52e28c1
```

### Optional Variables

```
# Log level (debug, info, warn, error)
REACT_APP_LOG_LEVEL=info

# Feature flags
REACT_APP_ENABLE_FEATURE_X=true
```

## Environment Detection

The application uses several methods to detect the current environment:

1. **Environment Variable**: The `REACT_APP_ENVIRONMENT` environment variable explicitly sets the environment.
2. **Domain-Based Detection**: The application checks the current domain against known patterns.
3. **NODE_ENV Fallback**: If no other detection methods succeed, `NODE_ENV` is used.
4. **Default**: Development is used as the default if all other methods fail.

## Adding New Environment-Specific Configuration

When adding new environment-specific configuration, follow these steps:

1. Add the configuration to the appropriate environment config object in `src/config/api.ts` or other relevant configuration files.
2. If the configuration relies on an environment variable, add it to `src/config/environment.ts` in the `environmentVars` object.
3. Document the new variable in this guide.
4. Update the `.env.example` file with the new variable.

## Environment Configuration Files

The environment configuration is spread across several files:

- `src/config/environment.ts` - Environment detection and shared utilities
- `src/config/api.ts` - API endpoint configuration for each environment
- `src/config/auth/msalConfig.ts` - Authentication configuration for each environment
- `src/config/auth/authConfig.ts` - Authorization and permission configuration

Each file follows the pattern of having separate configuration objects for each environment and a selector function that returns the appropriate configuration based on the detected environment.
