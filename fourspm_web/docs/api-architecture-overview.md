# FourSPM API Architecture Overview

## Introduction

This document provides a comprehensive overview of the FourSPM application API architecture, focusing on the standardized patterns, centralized configurations, and best practices used throughout the application.

## Architectural Layers

The FourSPM API architecture is organized into the following layers:

```
┌──────────────────────┐
│    UI Components     │
│                      │
│   Pages & Widgets    │
└──────────────────────┘
          ▲
          │
┌──────────────────────┐
│   Controller Hooks   │
│                      │
│ use{Entity}Controller│
└──────────────────────┘
          ▲
          │
┌──────────────────────┐    ┌──────────────────────┐
│     Domain Layer     │    │   Data Providers     │
│                      │    │                      │
│  {entity}.service.ts │    │ use{Entity}DataProvider
└──────────────────────┘    └──────────────────────┘
          ▲                           ▲
          │                           │
┌──────────────────────┐    ┌──────────────────────┐
│     Adapter Layer    │    │      Utilities       │
│                      │    │                      │
│  {entity}.adapter.ts │    │   odata-filters.ts   │
└──────────────────────┘    └──────────────────────┘
          ▲                           ▲
          │                           │
┌──────────────────────┐    ┌──────────────────────┐
│     Shared Layer     │    │  Centralized Config  │
│                      │    │                      │
│ shared-api.service.ts│    │   api-endpoints.ts   │
└──────────────────────┘    └──────────────────────┘
          ▲
          │
┌──────────────────────┐
│      Base Layer      │
│                      │
│  base-api.service.ts │
└──────────────────────┘
```

## Layers Description

### 1. Base Layer

The foundation of the API architecture, implemented in `base-api.service.ts`. This layer:

- Provides a generic request method for RESTful API requests
- Handles authentication token management
- Provides consistent error handling and logging
- Exports both a singleton instance and a backward-compatibility function

### 2. Shared Layer

Implemented in `shared-api.service.ts`, this layer:

- Provides generic methods for common operations (getById, getAll, update, post)
- Handles error handling and token validation consistently
- Exports a singleton instance for use across the application
- Manages API response formats including both direct entity responses and collections

### 3. Centralized API Configuration

Implemented in `api-endpoints.ts`, this layer:

- Defines all OData endpoints as constants in a single location for maintainability
- Includes standardized endpoint URLs for all entities (PROJECTS_ENDPOINT, DELIVERABLES_ENDPOINT, etc.)
- Provides specialized query generation functions (getDeliverablesWithProgressQuery, etc.)
- Acts as a single source of truth for API endpoint information

### 4. Adapter Layer

Entity-specific adapter modules that serve as intermediaries between raw API services and controller hooks:

- Transform data between API and frontend formats
- Encapsulate entity-specific business logic
- Handle complex operations that may involve multiple API calls
- Provide consistent error handling for entity operations
- Reference centralized API endpoints from api-endpoints.ts

### 5. Utilities

Utility services for common operations:

- `odata-filters.ts` provides standardized functions for creating OData filters
- Helper functions for query parameter construction
- Reusable methods for common data transformation needs

### 6. Domain Layer

Domain service files implement business logic and act as facades for the SharedApiService:

- Entity-specific services (e.g., `progress.service.ts`, `project.service.ts`)
- Handle complex business operations
- Coordinate between multiple adapters when needed
- Provide a clean API for controller hooks

### 7. Data Providers

Provide specialized React hooks for data fetching and caching:

- Offer data loading, refreshing, and pagination capabilities
- Handle caching logic for lookup data
- Support filtering and search for data collections
- Typically consumed by controller hooks and UI components

### 8. Authentication Provider

The authentication system is a critical cross-cutting concern implemented through `useAuth`:

- Manages user authentication state throughout the application
- Provides token management for all API requests
- Handles login, logout, and session refresh flows
- Enforces authorization rules for protected routes and features
- Integrates with the API layers to ensure all requests include proper authentication

The `useAuth` hook is particularly important as it:

- Provides a consistent authentication context to all components
- Centralizes security-related logic in one location
- Abstracts authentication complexities from UI components
- Integrates with the token management in the Base API layer

### 9. Controller Hook Layer

Specialized React hooks that combine domain services with component lifecycle management:

- Form state management
- Grid row operations (insert, update, delete)
- Validation logic
- Error handling and user feedback
- Examples include `useDeliverableController.ts`, `useProjectEntityController.ts`

### 10. UI Components Layer

The presentation layer that consumes controller hooks:

- Page components for primary views
- Reusable widget components
- Form definitions
- Data visualization components

## Standardized Patterns

### API Endpoint Centralization

All OData endpoints are defined in a single location (`api-endpoints.ts`) as constants:

```typescript
// Example from api-endpoints.ts
export const PROJECTS_ENDPOINT = '/odata/v1/Projects';
export const DELIVERABLES_ENDPOINT = '/odata/v1/Deliverables';
export const AREAS_ENDPOINT = '/odata/v1/Areas';
// Additional endpoints...
```

All adapter files reference these centralized constants instead of hardcoding URLs:

```typescript
// Example from project.adapter.ts
import { PROJECTS_ENDPOINT } from '../api-endpoints';

export const getProjectById = async (id: string): Promise<Project> => {
  const result = await sharedApiService.getById(PROJECTS_ENDPOINT, id, token);
  return result;
};
```

### OData Query Standardization

Standardized query generation functions maintain consistency across the application:

```typescript
// Example from api-endpoints.ts
export const getDeliverablesWithProgressQuery = (projectId: string): string => {
  return `$filter=ProjectGuid eq ${projectId}&$expand=Progress($filter=PeriodNumber eq 1)`;
};

export const getDeliverablesWithProgressUrl = (projectId: string): string => {
  return `${DELIVERABLES_ENDPOINT}?${getDeliverablesWithProgressQuery(projectId)}`;
};
```

### OData Filter Utilities

Consistent filter creation through utility functions:

```typescript
// Example from odata-filters.ts
export const createEqualsFilter = (field: string, value: string): string => {
  return `${field} eq ${value}`;
};

export const createProjectFilter = (projectId: string): string => {
  return createEqualsFilter('ProjectGuid', projectId);
};

export const createODataFilterParam = (filter: string): string => {
  return `$filter=${filter}`;
};
```

## Implementation Guide

### Adding a New API Endpoint

1. Add the new endpoint constant to `api-endpoints.ts`:
   ```typescript
   export const NEW_ENTITY_ENDPOINT = '/odata/v1/NewEntities';
   ```

2. Create specialized query functions if needed:
   ```typescript
   export const getNewEntitiesWithRelatedDataQuery = (params): string => {
     // Query construction logic
   };
   ```

3. Reference the endpoint constant in the entity adapter:
   ```typescript
   import { NEW_ENTITY_ENDPOINT } from '../api-endpoints';
   ```

### Creating a New Entity Adapter

1. Create a new adapter file following the established pattern:
   ```typescript
   // new-entity.adapter.ts
   import { sharedApiService } from '../shared-api.service';
   import { NEW_ENTITY_ENDPOINT } from '../api-endpoints';
   
   export const getNewEntityById = async (id: string, token: string): Promise<NewEntity> => {
     const result = await sharedApiService.getById(NEW_ENTITY_ENDPOINT, id, token);
     return result;
   };
   
   export const getAllNewEntities = async (token: string): Promise<NewEntity[]> => {
     const result = await sharedApiService.getAll(NEW_ENTITY_ENDPOINT, token);
     return result.value;
   };
   ```

## Related Documentation

- [Entity Detail Doctrine](./entity-detail-doctrine.md) - Documentation for implementing entity detail views
- [Collection View Doctrine](./collection-view-doctrine.md) - Documentation for implementing collection views
