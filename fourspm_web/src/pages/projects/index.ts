export { default } from './projects';
export { projectColumns } from './project-columns';
export { projectStatuses } from './project-statuses';

// Types
export interface Project {
  guid: string;
  projectNumber: string;
  clientNumber: string;
  name: string;
  clientContact: string;
  purchaseOrderNumber?: string;
  projectStatus: string;
  created: Date;
}
