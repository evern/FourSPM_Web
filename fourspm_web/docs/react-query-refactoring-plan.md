# React Query Refactoring Plan for FourSPM Web Application

**Date:** May 9, 2025  
**Author:** Cascade

## Overview

This document outlines the strategy for refactoring the FourSPM Web application's data fetching architecture to use React Query. The goal is to reduce unnecessary re-renders, improve data caching, and establish a more consistent pattern for handling server state.

## Current Architecture Issues

- Multiple data providers cause cascading renders during data loading
- Each provider maintains its own loading/error states
- Custom caching logic is inconsistent across providers
- Grid components re-render excessively due to prop changes

## Refactoring Strategy

### Step 1: Set Up React Query Providers

```tsx
// src/index.tsx or App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 30 * 60 * 1000, // 30 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* App content */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

### Step 2: Leverage Existing BaseApiService

```tsx
// src/hooks/queries/base-query-utils.ts
import { BaseApiService } from '../../api/base-api.service'
import { AREAS_ENDPOINT, DELIVERABLES_ENDPOINT } from '../config/api-endpoints'

// Use the existing BaseApiService which already handles authentication and error handling
const apiService = new BaseApiService()

export const fetchAreas = async (projectId?: string) => {
  const filter = projectId ? `$filter=projectGuid eq ${projectId}` : ''
  const url = `${AREAS_ENDPOINT}?${filter}`
  
  const response = await apiService.request(url)
  const data = await response.json()
  
  return (data.value || []).map(area => ({
    ...area,
    areaNumber: area.number // Maintain backward compatibility
  }))
}

export const fetchDeliverables = async (projectId?: string) => {
  const filter = projectId ? `$filter=projectGuid eq ${projectId}` : ''
  const url = `${DELIVERABLES_ENDPOINT}?${filter}`
  
  const response = await apiService.request(url)
  const data = await response.json()
  
  return data.value || []
}
```

### Step 3: Refactor Individual Data Providers

Refactor each data provider in `src/hooks/data-providers` to use React Query:

```tsx
// src/hooks/queries/useAreasQuery.ts
import { useQuery } from '@tanstack/react-query'
import { fetchAreas } from './base-query-utils'
import { Area } from '../../types/odata-types'

export const useAreasQuery = (projectId?: string) => {
  return useQuery({
    queryKey: ['areas', projectId],
    queryFn: () => fetchAreas(projectId),
    enabled: !!projectId
    // No need for select as the fetchAreas already includes the transformation
  })
}
```

Repeat for all providers:
- useDisciplineQuery.ts
- useDocumentTypeQuery.ts
- useDeliverableGateQuery.ts
- useClientQuery.ts
- useVariationQuery.ts

### Step 4: Create Compatible Provider Adapters

To ensure backward compatibility with existing code, create adapters that expose the same interface:

```tsx
// src/hooks/data-providers/useAreaDataProvider.ts
import { useAreasQuery } from '../queries/useAreasQuery'

export const useAreaDataProvider = (projectId?: string) => {
  const { 
    data: areas = [], 
    isLoading, 
    error,
    refetch 
  } = useAreasQuery(projectId)
  
  // Create backward compatible data source
  const areasDataSource = {
    load: (loadOptions) => {
      // Logic to support existing components
    },
    byKey: (key) => {
      // Find item by key
    },
    map: (item) => ({
      ...item,
      areaNumber: item.number
    })
  }
  
  return {
    areas,
    areasDataSource,
    isLoading,
    error,
    getAreaById: (id) => areas.find(a => a.guid === id),
    getAreaByNumber: (number) => areas.find(a => a.number === number),
    getFilteredAreas: (pid) => areas.filter(a => a.projectGuid === pid)
  }
}
```

### Step 5: Create a Consolidated Query Hook

```tsx
// src/hooks/queries/useProjectData.ts
import { useQuery } from '@tanstack/react-query'
import { useAreasQuery } from './useAreasQuery'
import { useDisciplinesQuery } from './useDisciplinesQuery'
import { useDocumentTypesQuery } from './useDocumentTypesQuery'

export const useProjectData = (projectId?: string) => {
  // Query for areas
  const areasQuery = useAreasQuery(projectId)
  
  // Query for disciplines
  const disciplinesQuery = useDisciplinesQuery()
  
  // Query for document types
  const documentTypesQuery = useDocumentTypesQuery()

  // Combined loading state
  const isLoading = 
    areasQuery.isLoading || 
    disciplinesQuery.isLoading || 
    documentTypesQuery.isLoading

  // Combined error state
  const error = 
    areasQuery.error || 
    disciplinesQuery.error || 
    documentTypesQuery.error

  return {
    areas: areasQuery.data || [],
    disciplines: disciplinesQuery.data || [],
    documentTypes: documentTypesQuery.data || [],
    areasDataSource: areasQuery.data ? createCompatibleDataSource(areasQuery.data) : null,
    disciplinesDataSource: disciplinesQuery.data ? createCompatibleDataSource(disciplinesQuery.data) : null,
    documentTypesDataSource: documentTypesQuery.data ? createCompatibleDataSource(documentTypesQuery.data) : null,
    isLoading,
    error
  }
}

const createCompatibleDataSource = (data) => ({
  load: () => Promise.resolve(data),
  byKey: (key) => Promise.resolve(data.find(item => item.guid === key)),
})
```

### Step 6: Refactor Deliverables Component

Refactor the `deliverables.tsx` component to use the consolidated hook:

```tsx
// src/pages/deliverables/deliverables.tsx
import React, { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useProjectData } from '../../hooks/queries/useProjectData'
import { useDeliverableGridHandlers } from '../../hooks/grid-handlers/useDeliverableGridHandlers'
import ODataGrid from '../../components/grid/ODataGrid'

const Deliverables = () => {
  const { projectId } = useParams()
  
  return (
    <DeliverablesContent projectId={projectId} />
  )
}

const DeliverablesContent = React.memo(({ projectId }) => {
  // Use consolidated data hook
  const { 
    areas, 
    disciplines, 
    documentTypes, 
    isLoading, 
    error 
  } = useProjectData(projectId)
  
  // Grid handlers
  const gridHandlers = useDeliverableGridHandlers({
    projectId,
    areas,
    disciplines,
    documentTypes
  })
  
  // Memoize columns to prevent re-renders
  const columns = useMemo(() => [
    // Column definitions
  ], [areas, disciplines, documentTypes])
  
  if (isLoading) return <LoadPanel visible={true} />
  if (error) return <div>Error loading data: {error.message}</div>
  
  return (
    <ODataGrid
      dataSource={createDeliverableDataSource(projectId)}
      columns={columns}
      onRowValidating={gridHandlers.handleRowValidating}
      onRowUpdating={gridHandlers.handleRowUpdating}
      onRowInserting={gridHandlers.handleRowInserting}
      onRowRemoving={gridHandlers.handleRowRemoving}
      onInitNewRow={gridHandlers.handleInitNewRow}
      onEditorPreparing={gridHandlers.handleEditorPreparing}
      remoteOperations={true}
      virtualScrolling={true}
      onInitialized={gridHandlers.handleGridInitialized}
    />
  )
}, (prevProps, nextProps) => {
  // Only re-render if projectId changes
  return prevProps.projectId === nextProps.projectId
})

// Helper to create a data source for deliverables
const createDeliverableDataSource = (projectId) => {
  // Implementation details
}

export default Deliverables
```

### Step 7: Add Mutations for Data Changes

```tsx
// src/hooks/mutations/useDeliverableMutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'

const updateDeliverable = async (data) => {
  // Implementation of API call
}

export const useDeliverableMutations = (projectId) => {
  const queryClient = useQueryClient()
  
  const updateMutation = useMutation({
    mutationFn: updateDeliverable,
    onSuccess: () => {
      queryClient.invalidateQueries(['deliverables', projectId])
    }
  })
  
  // Similar mutations for insert and delete
  
  return {
    updateDeliverable: updateMutation.mutate,
    // Add other mutation functions
    isUpdating: updateMutation.isLoading,
    // Add other loading states
  }
}
```

## Implementation Order

1. Set up React Query Provider in App/index
2. Leverage existing BaseApiService for query functions
3. Create individual query hooks
4. Create the consolidated hook
5. Create adapter hooks for backward compatibility
6. Refactor the Deliverables component
7. Implement mutations for data changes
8. Test thoroughly and address any performance issues

## Benefits

- **Reduced Renders**: Components only re-render when their specific data changes
- **Consistent Loading States**: Unified approach to loading indicators
- **Automatic Caching**: Built-in caching with configurable invalidation
- **Background Refetching**: Keep data fresh without disrupting the user
- **Simplified Code**: Less boilerplate for data fetching

## Potential Issues

- DevExtreme components may require custom adapters for DataSource compatibility
- ODataStore-specific features might need custom implementations
- Existing components expecting the old provider interface will need adapters

## Next Steps

After implementing React Query for the Deliverables module, we should:

1. Monitor performance metrics to verify improvement
2. Apply the same pattern to other features gradually
3. Consider further optimizations like optimistic updates
4. Document the new pattern for team adoption
