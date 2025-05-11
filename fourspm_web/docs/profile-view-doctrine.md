# Profile View Architecture Doctrine

This document outlines the context-based architecture pattern used in profile view components like the Project Profile. This architectural approach provides improved state management, better separation of concerns, and consistent handling of loading and data persistence.

## Architecture Overview

The profile view architecture uses a React Context-based pattern with the following key components:

1. **Context Provider**: Manages state and operations for the profile
2. **Reducer**: Handles state updates in a predictable manner
3. **View Component**: Renders the UI based on context state
4. **Form Items Configuration**: Defines form structure and behavior

```
┌───────────────────┐     ┌─────────────────┐
│ Context Provider  │◄────┤ Type Definitions │
└───────┬───────────┘     └─────────────────┘
        │                 ┌─────────────────┐
        │                 │     Reducer     │
        ▼                 └────────┬────────┘
┌───────────────────┐              │
│  View Component   │◄─────────────┘
└───────┬───────────┘
        │                 ┌─────────────────┐
        ▼                 │   Form Items    │
┌───────────────────┐     │  Configuration  │
│    Form Render    │◄────┴─────────────────┘
└───────────────────┘
```

## Key Principles

### Context Provider Responsibilities

1. **State Management:**
   - Maintains the entity state (loading, error, data, editing mode)
   - Provides operations for editing, saving, and canceling changes
   - Manages form references and validation

2. **Data Loading:**
   - Handles fetching the entity data from APIs
   - Manages related data loading (e.g., client details for a project)
   - Ensures data is fully loaded before allowing rendering

3. **Form Operations:**
   - Controls form state transitions (view → edit → save/cancel)
   - Provides form instance access for direct manipulation
   - Maintains original data for proper cancel operations

### View Component Responsibilities

1. **UI Rendering:**
   - Consumes context to display appropriate UI
   - Handles conditional rendering based on state
   - Manages responsive layout and device adaptations

2. **User Interaction:**
   - Delegates user actions to context operations
   - Provides appropriate UI feedback for operations
   - Handles scroll position and focus management

### Form Structure

1. **Data Structure:**
   - Form fields MUST match the expected data structure
   - Nested fields use dot notation (e.g., 'client.clientContactName')
   - Form data updates should maintain proper references

2. **Field Configuration:**
   - Fields are configured through a dedicated items configuration
   - ReadOnly states are derived from the editing context
   - Lookup fields handle loading states and selection changes

## Implementation Requirements

### Context Implementation

1. **State Management:**
   - MUST use reducer pattern for state updates
   - MUST handle component mounting/unmounting cleanly
   - MUST provide clear type definitions

2. **Loading:**
   - MUST set loading state appropriately
   - MUST handle API errors gracefully
   - MUST ensure complete data before rendering

3. **Form Operations:**
   - MUST preserve original entity data for cancel operations
   - MUST handle form instance properly for field updates
   - MUST validate data before saving

### View Implementation

1. **Loading States:**
   - MUST show appropriate loading indicators
   - MUST prevent interaction during loading/saving
   - MUST handle transitions smoothly

2. **Error Handling:**
   - MUST display API errors appropriately
   - MUST show validation errors in the form
   - MUST handle network errors gracefully

### Form Field Handling

1. **Data Structure:**
   - MUST maintain proper nested structure for form data
   - MUST handle reference updates properly
   - MUST ensure form updates trigger context updates

2. **Special Fields:**
   - Lookup fields MUST update related fields on selection
   - Date fields MUST use consistent formatting
   - Required fields MUST have appropriate validation

## Implementation Checklist

When implementing a new profile view, follow these steps:

1. [ ] Create context, types, and reducer files
2. [ ] Implement the context provider with proper loading and operations
3. [ ] Define form items configuration with appropriate field structures
4. [ ] Implement the view component with context consumption
5. [ ] Ensure proper loading and error handling
6. [ ] Test all operations (loading, editing, saving, canceling)

## Example Implementation

The Project Profile view is the reference implementation of this architecture. Refer to:

- Context Provider: `src/contexts/project-profile/project-profile-context.tsx`
- Type Definitions: `src/contexts/project-profile/project-profile-types.ts`
- Reducer: `src/contexts/project-profile/project-profile-reducer.ts`
- View Component: `src/pages/project/project-profile.tsx`
- Form Items: `src/pages/project/project-profile-items.ts`

## Benefits Over Previous Patterns

1. **Improved State Isolation:**
   - Context pattern provides better isolation of state
   - State transitions are more predictable with reducer pattern
   - Component unmounting is handled properly

2. **Better Loading Experience:**
   - Complete data loading before rendering prevents UI flicker
   - Separate loading states for initial load and saving operations
   - More responsive UI with appropriate feedback

3. **Simplified Data Handling:**
   - Clearer separation between data and presentation
   - More predictable form operations
   - Better handling of related entity data (e.g., clients)

4. **Easier Testing and Maintenance:**
   - Separation of concerns makes testing easier
   - Context can be mocked for component testing
   - Cleaner component structure improves maintainability
