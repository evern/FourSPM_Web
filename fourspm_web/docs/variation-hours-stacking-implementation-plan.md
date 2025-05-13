# Variation Hours Stacking Implementation Plan

## Overview
This document outlines the implementation plan for allowing "stacking" of variation hours across multiple variations. Currently, the system prevents editing deliverables that belong to approved variations. We want to modify this behavior to allow variation hours to be added to deliverables across multiple variations while maintaining data integrity.

## Current Limitations
1. Deliverables from approved variations cannot be modified
2. Deliverables from one variation cannot be updated via another variation
3. Variations with deliverables used by other variations can be rejected, potentially causing data integrity issues

## Implementation Goals
1. Allow variation hours to be "stacked" across multiple variations
2. Prevent rejection of variations that have deliverables referenced by other variations
3. Maintain existing business rules for non-hours modifications

## Implementation Plan

### 1. Backend Changes (WebService)

#### A. Modify `VariationDeliverablesController.HandleVariationUpdate`

```csharp
private async Task<IActionResult> HandleVariationUpdate(Guid key, DeliverableEntity entity, Delta<DeliverableEntity> delta)
{
    // Existing validation code...
    
    // Check if we're only updating variation hours, which is allowed even for deliverables from other variations
    bool isVariationHoursChange = delta.GetChangedPropertyNames().Count == 1 && 
                                delta.GetChangedPropertyNames().Contains("VariationHours");
    
    // Do not allow updates to approved variations UNLESS it's just changing variation hours
    bool isApproved = originalDeliverable.VARIATION_STATUS == (int)VariationStatus.ApprovedVariation || 
                    originalDeliverable.VARIATION_STATUS == (int)VariationStatus.ApprovedCancellation;
    if (isApproved && !isVariationHoursChange)
        return BadRequest("Cannot modify deliverables for approved variations except for variation hours");
    
    // Determine whether this is updating the original deliverable
    bool isOriginal = key == entity.OriginalDeliverableGuid.Value;
    
    // Allow direct update path for:
    // 1. Original deliverables that belong to this variation OR
    // 2. Variation hours changes regardless of variation ownership
    if ((isOriginal && originalDeliverable.GUID_VARIATION == entity.VariationGuid) || isVariationHoursChange)
    {
        return await HandleStandardDeliverableUpdate(originalDeliverable, delta);
    }
    
    // Rest of existing code...
}
```

#### B. Modify `VariationRepository.RejectVariationAsync`

```csharp
public async Task<VARIATION> RejectVariationAsync(Guid variationGuid)
{
    // Existing validation code...
    
    // NEW: Check if this variation has deliverables that are referenced by other variations
    var deliverablesToCheck = await _context.DELIVERABLEs
        .Where(d => d.GUID_VARIATION == variationGuid && d.DELETED == null)
        .ToListAsync();

    foreach (var deliverable in deliverablesToCheck)
    {
        // Look for any deliverables in other variations that reference this deliverable
        var dependentDeliverables = await _context.DELIVERABLEs
            .Where(d => d.GUID_ORIGINAL_DELIVERABLE == deliverable.GUID && 
                      d.GUID_VARIATION != variationGuid && 
                      d.DELETED == null)
            .ToListAsync();
        
        if (dependentDeliverables.Any())
        {
            throw new InvalidOperationException(
                "This variation cannot be rejected because its deliverables are used in other variations. " +
                "Please reject the dependent variations first.");
        }
    }
    
    // Rest of existing rejection code...
}
```

**Note:** Special handling in `ApproveVariationAsync` is not needed since the current system already correctly accumulates variation hours in the `APPROVED_VARIATION_HOURS` field. Each variation properly adds its contribution when approved and removes it when rejected.

### 2. Frontend Changes (Web)

#### A. Modify `useVariationDeliverableGridHandlers.ts`

```typescript
const update = async () => {
  try {
    // Check if this is a modification to variation hours specifically
    const isVariationHoursChange = e.newData.hasOwnProperty('variationHours');
    
    // Use the context's enhanced update function with skipStateUpdate=false to allow full updating
    const result = await variationDeliverables.updateVariationDeliverable(newData, false);
    
    // If the update was not allowed by business rules
    if (result === false) {
      // Extract variation name if available
      let variationName = 'an approved variation';
      if (newData.variation && newData.variation.name) {
        variationName = newData.variation.name;
      } else if (newData.variationName) {
        variationName = newData.variationName;
      }
      
      // Only block non-variation-hours changes to approved variations
      if (!isVariationHoursChange) {
        await alert(`Only variation hours can be modified for deliverables from ${variationName}.`, 'Limited Modification');
        return false;
      }
    }
    
    // Refresh the grid after successful update
    setTimeout(() => {
      // Cancel any pending edits
      if (e.component.hasEditData()) {
        e.component.cancelEditData();
      }
      
      // Use the stored grid reference which is more stable than e.component
      if (gridRef.current) {
        gridRef.current.refresh();
      }
    }, 50);
    
    return true;
  } catch (error) {
    console.error('Error updating variation deliverable:', error);
    throw error;
  }
};
```

#### B. Update `updateVariationDeliverable` in context

```typescript
// In variation-deliverables-context.tsx
const updateVariationDeliverable = async (deliverable: VariationDeliverable, skipStateUpdate = false) => {
  // Check if this is just a variation hours update
  const isVariationHoursChange = Object.keys(deliverable).length === 1 && 
                              'variationHours' in deliverable;
  
  // Get current deliverable data to compare
  const currentData = deliverables.find(d => 
    d.originalDeliverableGuid === deliverable.originalDeliverableGuid);
  
  // Skip approval check for variation hours changes
  if (currentData?.variationStatus === 'ApprovedVariation' || 
      currentData?.variationStatus === 'ApprovedCancellation') {
    if (!isVariationHoursChange) {
      return false; // Block non-hours changes to approved variations
    }
  }
  
  try {
    // Existing update code...
    
    // Special handling for stacked variation hours
    if (isVariationHoursChange) {
      // Update UI optimistically for better user experience
      // [Implementation depends on current state management approach]
    }
    
    // Rest of existing code...
  } catch (error) {
    // Error handling...
  }
};
```

### 3. UI Enhancements

#### A. Add Visual Indicators for Stacked Hours

```typescript
// In variation-deliverable-columns.ts
const columns: ODataGridColumn[] = [
  // Existing columns...
  {
    dataField: 'variationHours',
    caption: 'Variation Hours',
    dataType: 'number',
    alignment: 'right',
    // Add visual indicator for stacked hours
    cellRender: (e: any) => {
      const data = e.data;
      const hasStackedHours = data.originalDeliverableGuid && 
                            data.guid !== data.originalDeliverableGuid &&
                            data.variationHours > 0;
      
      if (hasStackedHours) {
        return (
          <div className="stacked-hours">
            <span>{e.text}</span>
            <Tooltip title="Hours stacked from another variation">
              <Icon type="layers" color="accent" />
            </Tooltip>
          </div>
        );
      }
      
      return <span>{e.text}</span>;
    }
  }
  // Other columns...
];
```

#### B. Add Warning Before Rejection of Variations with References

```typescript
// In useVariationOperations.ts or similar
const rejectVariation = async (variationId: string) => {
  try {
    await api.post(`/api/variations/${variationId}/reject`);
    // Success handling
  } catch (error) {
    // Handle specific error for referenced deliverables
    if (error.response?.status === 400 && 
        error.response?.data?.includes('used in other variations')) {
      await alert(
        "This variation cannot be rejected because its deliverables are used in other variations. " +
        "Please reject the dependent variations first.",
        "Dependent Variations Exist"
      );
    } else {
      // Handle other errors
    }
  }
};
```

## Testing Plan

1. **Unit Tests**
   - Test `HandleVariationUpdate` with various combinations of approved status and field changes
   - Test rejection of variations with and without dependent deliverables
   - Test approval of variations with stacked hours

2. **Integration Tests**
   - Create test scenarios with multiple variations referencing the same deliverables
   - Verify that hours stack correctly across variations
   - Verify that rejection is blocked when dependencies exist

3. **UI Testing**
   - Verify that variation hours can be edited even for deliverables from approved variations
   - Verify that other fields cannot be edited for deliverables from approved variations
   - Test the visual indicators for stacked hours

## Rollout Plan

1. Implement backend changes first
2. Add comprehensive unit tests
3. Implement frontend changes
4. Perform integration testing
5. Deploy to staging environment for QA
6. Deploy to production

## Potential Challenges

1. **Data Consistency**: Ensuring proper calculation of total variation hours across multiple variations
2. **UI Clarity**: Making it clear to users which hours are stacked and from which variations
3. **Performance**: Additional queries to check for dependencies might impact performance for large projects
4. **Edge Cases**: Handling situations where variations reference each other in complex ways
