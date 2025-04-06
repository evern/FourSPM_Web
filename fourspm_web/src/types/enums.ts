// Application-wide enum definitions 

// String-based lookup definitions for UI display
export const departmentEnum = [
  { id: 'Administration', name: 'Administration' },
  { id: 'Design', name: 'Design' },
  { id: 'Engineering', name: 'Engineering' },
  { id: 'Management', name: 'Management' }
];

export const deliverableTypeEnum = [
  { id: 'Task', name: 'Task' },
  { id: 'NonDeliverable', name: 'Non Deliverable' },
  { id: 'DeliverableICR', name: 'Deliverable ICR' },
  { id: 'Deliverable', name: 'Deliverable' }
];

// Project status options
export const projectStatuses = [
  { id: 'TenderInProgress', name: 'Tender In Progress' },
  { id: 'TenderSubmitted', name: 'Tender Submitted' },
  { id: 'Awarded', name: 'Awarded' },
  { id: 'Closed', name: 'Closed' },
  { id: 'Cancelled', name: 'Cancelled' }
];

export const variationStatusEnum = [
  { id: 'Unapproved', name: 'Unapproved' },
  { id: 'Approved', name: 'Approved' },
  { id: 'UnapprovedCancellation', name: 'Unapproved Cancellation' },
  { id: 'ApprovedCancellation', name: 'Approved Cancellation' }
];
