# Variation Approval/Rejection Test Cases

This document outlines test cases for validating the variation approval and rejection sequencing controls.

## Approval Test Cases

### Test Case 1: Approve Variation with No Dependencies
- **Setup**: Create a variation with deliverables that don't depend on other variations
- **Action**: Approve the variation
- **Expected Result**: Variation is approved successfully, success message displayed

### Test Case 2: Approve Variation with Unapproved Dependencies
- **Setup**: 
  - Create Variation A (unapproved)
  - Create Variation B with deliverables that stack hours on Variation A's deliverables
- **Action**: Attempt to approve Variation B
- **Expected Result**: 
  - Operation fails
  - Alert dialog shows error message: "Cannot approve this variation because it depends on unapproved variations: [Variation A]. Please approve these variations first."

### Test Case 3: Approve Variation after Dependencies are Approved
- **Setup**: 
  - Create Variation A (initially unapproved)
  - Create Variation B with deliverables that stack hours on Variation A's deliverables
  - Approve Variation A
- **Action**: Attempt to approve Variation B
- **Expected Result**: Variation B is approved successfully

### Test Case 4: Approve Multiple Dependent Variations in Correct Order
- **Setup**: 
  - Create Variations A, B, and C with dependencies A → B → C
- **Action**: Approve in order: A, then B, then C
- **Expected Result**: All variations are approved successfully

## Rejection Test Cases

### Test Case 5: Reject Variation with No Dependents
- **Setup**: Create a variation with deliverables that aren't used by other variations
- **Action**: Reject the variation
- **Expected Result**: Variation is rejected successfully, success message displayed

### Test Case 6: Reject Variation with Dependent Variations
- **Setup**: 
  - Create Variation A
  - Create Variation B with deliverables that stack hours on Variation A's deliverables
- **Action**: Attempt to reject Variation A
- **Expected Result**: 
  - Operation fails
  - Alert dialog shows error message: "Cannot reject this variation because its deliverables are used by: [Variation B]. Please reject these variations first."

### Test Case 7: Reject Variation after Dependents are Rejected
- **Setup**: 
  - Create Variation A
  - Create Variation B with deliverables that stack hours on Variation A's deliverables
  - Reject Variation B
- **Action**: Attempt to reject Variation A
- **Expected Result**: Variation A is rejected successfully

## Edge Cases

### Test Case 8: Approve Variation with Multiple Dependencies
- **Setup**: Create a variation that depends on multiple unapproved variations
- **Action**: Attempt to approve the variation
- **Expected Result**: Error message lists all dependencies that need approval

### Test Case 9: Reject Base Variation with Multiple Dependents
- **Setup**: Create a base variation that multiple other variations depend on
- **Action**: Attempt to reject the base variation
- **Expected Result**: Error message lists all dependent variations that need rejection first

### Test Case 10: Cancel Deliverable Referenced by Other Variations
- **Setup**: 
  - Create Variation A with a deliverable
  - Create Variation B that references Variation A's deliverable
- **Action**: Attempt to cancel the deliverable in Variation A
- **Expected Result**: Operation is prevented, error message indicates which variations reference the deliverable
