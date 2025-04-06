# Variation Deliverables Implementation - Execution Plan

This document provides a step-by-step execution plan for implementing the Variation Deliverables feature using a single-table approach.

## 1. Database Changes

### 1.1 Add New Fields to DELIVERABLE Table

```sql
-- Add new fields to the DELIVERABLE table
ALTER TABLE [dbo].[DELIVERABLE]
ADD
    [VARIATION_STATUS] [int] NOT NULL DEFAULT 0,
    [GUID_VARIATION] [uniqueidentifier] NULL,
    [GUID_ORIGINAL_DELIVERABLE] [uniqueidentifier] NULL,
    [APPROVED_VARIATION_HOURS] [decimal](10, 2) NOT NULL DEFAULT 0;
```

### 1.2 Create Database Indexes

```sql
-- Add indexes for better performance on variation queries
CREATE INDEX [IX_DELIVERABLE_VARIATION] ON [dbo].[DELIVERABLE] ([GUID_VARIATION]) WHERE [GUID_VARIATION] IS NOT NULL;
CREATE INDEX [IX_DELIVERABLE_ORIGINAL] ON [dbo].[DELIVERABLE] ([GUID_ORIGINAL_DELIVERABLE]) WHERE [GUID_ORIGINAL_DELIVERABLE] IS NOT NULL;
CREATE INDEX [IX_DELIVERABLE_VARIATION_STATUS] ON [dbo].[DELIVERABLE] ([VARIATION_STATUS]) WHERE [VARIATION_STATUS] <> 0;
```

### 1.3 Drop VARIATION_DELIVERABLE Table

```sql
-- This should be done only after migrating any existing data
DROP TABLE [dbo].[VARIATION_DELIVERABLE];
```

## 2. Backend Implementation

### 2.1 Update DELIVERABLE Entity Model

1. Add new variation-specific properties to DELIVERABLE entity:
   - `VARIATION_STATUS` (int)
   - `GUID_VARIATION` (Guid?)
   - `GUID_ORIGINAL_DELIVERABLE` (Guid?)
   - `APPROVED_VARIATION_HOURS` (decimal)

2. Create VariationStatus enum with appropriate values:
   - Standard (0)
   - UnapprovedVariation (1)
   - ApprovedVariation (2)
   - UnapprovedCancellation (3)
   - ApprovedCancellation (4)

### 2.2 Extend IDeliverableRepository

Add the following methods to the existing repository interface:

- `GetByVariationIdAsync(Guid variationId)`
- `GetVariationCopyAsync(Guid originalDeliverableId, Guid variationId)`
- `CreateVariationCopyAsync(DELIVERABLE original, Guid variationId, int variationStatus)`
- `CreateNewVariationDeliverableAsync(DELIVERABLE deliverable, Guid variationId)`
- `CreateVariationCancellationAsync(Guid originalDeliverableId, Guid variationId)`

### 2.3 Create API Endpoints

Implement the following OData endpoints in DeliverableController:

1. `GetByVariation(Guid variationId)` - GET
   - Retrieves all deliverables for a specific variation

2. `AddOrUpdateVariation(DeliverableVariationEntity entity)` - POST
   - Creates or updates a variation copy of an existing deliverable

3. `CreateForVariation(DeliverableEntity entity)` - POST
   - Creates a new deliverable for a variation

### 2.4 Update Variation Approval Logic

Modify the existing approval process to:

1. Handle different variation statuses
2. Update both the variation copy and original deliverable
3. Calculate cancellation values based on hours already earned

## 3. Frontend Implementation

### 3.1 Update API Endpoints Configuration

Add the following to api-endpoints.ts:

```typescript
// Variation deliverable endpoints
export const getDeliverablesByVariationUrl = (variationGuid: string) => 
    `${DELIVERABLES_ENDPOINT}/ByVariation/${variationGuid}`;
```

### 3.2 Update Deliverable Adapter

Add the following methods to deliverable.adapter.ts:

1. `addOrUpdateVariationDeliverable` - Handles both creation and update of variation copies
2. `createNewVariationDeliverable` - Creates brand new deliverables for a variation

### 3.3 Create Variation Deliverables Column Configuration

Create a new file for column definitions that includes:

1. Standard deliverable columns (title, area, discipline, etc.)
2. Variation-specific columns (variation hours, status)
3. Custom editors with appropriate validation

### 3.4 Implement Variation Deliverables Component

Create a React component that:

1. Displays deliverables for a specific variation
2. Allows editing variation properties
3. Provides a way to create new deliverables
4. Handles cancellation logic

### 3.5 Integrate with Variation Detail View

Add the variation deliverables component to the variation detail view.

## 4. Data Migration Plan

### 4.1 Backup Existing Data

```sql
-- Create backup of existing data
SELECT * INTO VARIATION_DELIVERABLE_BACKUP FROM VARIATION_DELIVERABLE;
```

### 4.2 Migrate Existing Variation Deliverables

```sql
-- Migrate existing data to the new structure
INSERT INTO DELIVERABLE (
    GUID, GUID_PROJECT, AREA_NUMBER, DISCIPLINE, DOCUMENT_TYPE,
    DEPARTMENT_ID, DELIVERABLE_TYPE_ID, GUID_DELIVERABLE_GATE,
    INTERNAL_DOCUMENT_NUMBER, CLIENT_DOCUMENT_NUMBER, DOCUMENT_TITLE,
    BUDGET_HOURS, VARIATION_HOURS, APPROVED_VARIATION_HOURS, BOOKING_CODE, TOTAL_COST,
    VARIATION_STATUS, GUID_VARIATION, GUID_ORIGINAL_DELIVERABLE,
    CREATED, CREATEDBY, UPDATED, UPDATEDBY
)
SELECT 
    NEWID(), -- New GUID for this record
    d.GUID_PROJECT, d.AREA_NUMBER, d.DISCIPLINE, d.DOCUMENT_TYPE,
    d.DEPARTMENT_ID, d.DELIVERABLE_TYPE_ID, d.GUID_DELIVERABLE_GATE,
    d.INTERNAL_DOCUMENT_NUMBER, d.CLIENT_DOCUMENT_NUMBER, d.DOCUMENT_TITLE,
    d.BUDGET_HOURS, vd.HOURS, CASE WHEN vd.IS_APPROVED = 1 THEN vd.HOURS ELSE 0 END, d.BOOKING_CODE, d.TOTAL_COST,
    CASE 
        WHEN vd.IS_APPROVED = 1 THEN 2 -- ApprovedVariation 
        ELSE 1 -- UnapprovedVariation
    END, 
    vd.GUID_VARIATION, vd.GUID_DELIVERABLE,
    vd.CREATED, vd.CREATEDBY, vd.UPDATED, vd.UPDATEDBY
FROM VARIATION_DELIVERABLE vd
JOIN DELIVERABLE d ON vd.GUID_DELIVERABLE = d.GUID
WHERE vd.DELETED IS NULL;
```

## 5. Testing Plan

### 5.1 Unit Tests

1. Test repository methods for retrieving and creating variation deliverables
2. Test API endpoints with various input scenarios
3. Test variation approval logic for both regular variations and cancellations

### 5.2 Integration Tests

1. Verify the complete workflow from creating a variation to approval
2. Test cancellation scenarios including partial progress
3. Verify that hours calculations are accurate in all scenarios

### 5.3 UI Testing

1. Test the variation deliverables grid functionality
2. Verify validation of inputs works correctly
3. Test creation of new deliverables and modification of existing ones

## 6. Deployment Steps

### 6.1 Pre-Deployment

1. Backup the database
2. Create a deployment package with all code changes
3. Prepare rollback scripts in case of issues

### 6.2 Deployment Sequence

1. Deploy database changes
   - Add new fields to DELIVERABLE table
   - Create indexes
   - Run data migration script

2. Deploy backend code changes
   - Update entity models
   - Add repository methods
   - Add API endpoints

3. Deploy frontend code changes
   - Update API endpoints configuration
   - Add adapter methods
   - Add variation deliverables component

### 6.3 Post-Deployment

1. Verify all endpoints are working correctly
2. Run smoke tests to validate basic functionality
3. Monitor for any errors in production logs
