export { default } from './projects';
export { projectColumns } from './project-columns';
export { projectStatuses } from './project-statuses';

// Client interface
export interface Client {
  guid: string;
  number: string;
  description: string;
  clientContact: string;
}

// Types
export interface Project {
  guid: string;
  projectNumber: string;
  name: string;
  purchaseOrderNumber?: string;
  projectStatus: string;
  clientGuid?: string;
  client?: Client;
  created: Date;
}
