# Variation Deliverables Requirements

## Overview
This document outlines the requirements for the variation deliverables feature in the FourSPM application. The focus is on creating a seamless user experience that allows project managers to efficiently manage deliverables within variations.

## User Interface Requirements

### 1. Grid Layout
The variation deliverables screen will display all deliverables in a single consolidated grid with the following key columns:
- Status indicator (Original, Add, Edit, Cancel)
- Document number and title
- Area, Department, Discipline information
- Original hours 
- Variation units/hours
- Total hours (calculated)
- Cancellation button column

### 2. Status Types
Each deliverable in the grid will have one of the following statuses:
- **Original**: A deliverable from the project that has not been added to the variation
- **Add**: A newly created deliverable within the variation
- **Edit**: An existing project deliverable that has been modified in the variation
- **Cancel**: A deliverable marked for cancellation in the variation

### 3. User Interactions

#### Adding New Deliverables
- Users can add a new deliverable directly to the grid using standard grid controls
- New deliverables are automatically assigned the status "Add"
- All required fields will be validated according to application rules
- Users can create multiple new deliverables in a single session

#### Modifying Existing Deliverables
- When a user modifies the variation units field of an "Original" deliverable, its status changes to "Edit"
- Changes to the variation units field are immediately reflected in the total hours calculation
- Users can edit other fields as permitted by the variation configuration

#### Cancellation Workflow
- Each row will have a cancellation button with context-sensitive behavior:
  - For "Original" deliverables: Changes status to "Cancel"
  - For "Add" deliverables: Removes the deliverable from the grid
  - For "Edit" deliverables: Sets variation units to 0 and changes status to "Cancel"
- Cancelled deliverables remain visible in the grid for transparency

### 4. Visual Design
- Status indicators will use color-coding for quick identification:
  - Original: Gray
  - Add: Blue
  - Edit: Green
  - Cancel: Red/Orange
- The cancellation button icon will change based on the row's status
- The grid will support standard features like sorting, filtering, and pagination

## Data Model Integration

### 1. Status Mapping
The UI statuses will map to database values as follows:
- Add → 'UnapprovedVariation'
- Edit → 'UnapprovedVariation'
- Cancel → 'UnapprovedCancellation'

Note: The frontend should use string representations of the backend enum values for consistency with other enums in the application, following the established OData serialization pattern. This means:
- Backend numeric values (0, 1, 2, 3) are represented as strings in the frontend
- The string values must exactly match the C# enum names ('Standard', 'UnapprovedVariation', 'ApprovedVariation', 'UnapprovedCancellation')
- The variation status enum in the frontend should be updated to use these string values instead of numbers

### 2. Database Operations
- Adding a new deliverable creates a new record in the deliverables table with the variation GUID
- Editing an existing deliverable creates a variation copy with a reference to the original deliverable
- Cancelling sets the appropriate variation status based on the context

### 3. OData Integration
- All API requests must follow established OData patterns:
  - Object references must be flattened to simple properties (client objects to clientNumber)
  - Property names must use consistent naming (guid instead of id, projectGuid instead of projectId)
  - All expected properties need default values even if empty/zero
  - Enum values must be properly serialized as strings ('Task', 'Administration', 'UnapprovedVariation')
  - Enum values must match C# enum names exactly ('Standard', 'UnapprovedVariation', not '0', '1')
  - Enum values are deserialized from JSON string property type when received from backend
- Use the centralized API endpoints for all operations (from api-endpoints.ts)

## Business Rules

### 1. Validation Rules
- Variation hours must be numeric and non-negative
- New deliverables must include all required fields (title, area, discipline, etc.)
- Changes to variation hours will be reflected in calculated fields (total hours, costs)
- DeliverableTypeId must use the proper enum string values ('Task', 'NonDeliverable', 'DeliverableICR', 'Deliverable')
- Read-only fields (bookingCode, internalDocumentNumber, clientNumber, projectNumber, totalHours) must not be editable

### 2. State Transitions
- Original → Edit: When variation hours are modified
- Original → Cancel: When cancel button is clicked (requires confirmation dialog)
- Add → [Removed]: When cancel button is clicked (requires confirmation dialog)
- Edit → Cancel: When cancel button is clicked (requires confirmation dialog and variation hours reset to 0)

### 3. Approval Workflow
- All changes (Add, Edit, Cancel) start with an "Unapproved" status
- When variation has a submitted or approved date:
  - All deliverables become completely read-only
  - No fields can be edited
  - No new deliverables can be added
- When variation does not have submitted or approved date:
  - For existing deliverables: Only variation hours field can be edited, all other fields are read-only
  - For new deliverables: All fields can be edited except the budget hours field (which is read-only)
- Approval process is handled separately through variation approval screens

## Performance Considerations
- The grid should load efficiently even with large numbers of deliverables
- Operations like adding, editing, and cancelling should provide immediate feedback
- State changes should be clearly visible to avoid user confusion
