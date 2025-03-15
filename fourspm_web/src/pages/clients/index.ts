export { default } from './clients';
export { clientColumns } from './client-columns';

// Types
export interface Client {
  guid: string;
  number: string;
  description?: string;
  clientContactName?: string;
  clientContactNumber?: string;
  clientContactEmail?: string;
  created: Date;
  createdBy?: string;
  updated?: Date;
  updatedBy?: string;
  deleted?: Date;
  deletedBy?: string;
}
