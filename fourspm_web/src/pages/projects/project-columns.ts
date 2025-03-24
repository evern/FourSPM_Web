import { ODataGridColumn } from '../../components/ODataGrid/ODataGrid';
import { projectStatuses } from '../../types/project';
import { clientsStore } from '../../stores/odataStores';
import React from 'react';

// Constants for reusable text
const CLIENT_CONTACT_PLACEHOLDER = 'Auto-filled on client selection';
const PROGRESS_START_TOOLTIP = 'Deliverables progress period will refresh weekly on the provided day of week';

export const projectColumns: ODataGridColumn[] = [
  { 
    dataField: 'projectNumber', 
    caption: 'Project #', 
    hidingPriority: 10  
  },
  { 
    dataField: 'clientGuid', 
    caption: 'Client', 
    hidingPriority: 7,  
    lookup: {
      dataSource: clientsStore,
      valueExpr: 'guid',
      displayExpr: (item: any) => item ? `${item.number} - ${item.description}` : ''
    }
  },
  { 
    dataField: 'name', 
    caption: 'Name', 
    hidingPriority: 9  
  },
  {
    dataField: 'client.clientContactName',
    caption: 'Client Contact',
    hidingPriority: 5,  
    allowEditing: false, 
    customizeText: (cellInfo: { value: string | null }) => {
      return cellInfo.value || CLIENT_CONTACT_PLACEHOLDER;
    },
    cellClass: 'faded-placeholder'
  },
  {
    dataField: 'client.clientContactNumber',
    caption: 'Contact Number',
    hidingPriority: 3,  
    allowEditing: false, 
    customizeText: (cellInfo: { value: string | null }) => {
      return cellInfo.value || CLIENT_CONTACT_PLACEHOLDER;
    },
    cellClass: 'faded-placeholder'
  },
  {
    dataField: 'client.clientContactEmail',
    caption: 'Contact Email',
    hidingPriority: 4,  
    allowEditing: false, 
    customizeText: (cellInfo: { value: string | null }) => {
      return cellInfo.value || CLIENT_CONTACT_PLACEHOLDER;
    },
    cellClass: 'faded-placeholder'
  },
  { 
    dataField: 'purchaseOrderNumber', 
    caption: 'PO #', 
    hidingPriority: 8  
  },
  {
    dataField: 'projectStatus',
    caption: 'Status',
    hidingPriority: 6,  
    lookup: {
      dataSource: projectStatuses,
      valueExpr: 'id',
      displayExpr: 'name'
    }
  },
  {
    dataField: 'progressStart',
    caption: 'Progress Start',
    hidingPriority: 2,  
    customizeText: (cellInfo: { value: string | null }) => {
      if (!cellInfo.value) return '';
      const date = new Date(cellInfo.value);
      return date.toLocaleDateString();
    },
    tooltip: PROGRESS_START_TOOLTIP
  },
  {
    dataField: 'created',
    caption: 'Created',
    hidingPriority: 1,  
    cellClass: 'faded-placeholder',
    allowEditing: false 
  }
];
