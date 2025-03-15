import React, { useState } from 'react';
import { API_CONFIG } from '../../config/api';
import { v4 as uuidv4 } from 'uuid';
import { ODataGrid } from '../../components/ODataGrid/ODataGrid';
import { useAutoIncrement } from '../../hooks/useAutoIncrement';
import { useGridValidation } from '../../hooks/useGridValidation';
import { useGridOperations } from '../../hooks/useGridOperations';
import { projectColumns } from './project-columns';
import { useNavigation } from '../../contexts/navigation';
import { useAuth } from '../../contexts/auth';
import './projects.scss';

const Projects: React.FC = () => {
  const endpoint = `${API_CONFIG.baseUrl}/odata/v1/Projects`;
  const { refreshNavigation } = useNavigation();
  const { user } = useAuth();
  
  const { nextNumber: nextProjectNumber, refreshNextNumber } = useAutoIncrement({
    endpoint,
    field: 'projectNumber'
  });

  // Custom handler to process client contact details when a client is selected
  const fetchClientDetails = async (clientGuid: string) => {
    try {
      const response = await fetch(`${API_CONFIG.baseUrl}/odata/v1/Clients(${clientGuid})`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch client details');
      }

      const clientData = await response.json();
      return clientData;
    } catch (error) {
      console.error('Error fetching client details:', error);
      return null;
    }
  };

  const { handleRowUpdating, handleRowRemoving, handleRowInserting } = useGridOperations({
    endpoint,
    onDeleteError: (error) => console.error('Failed to delete project:', error),
    onDeleteSuccess: refreshNavigation,
    onUpdateSuccess: refreshNavigation,
    onUpdateError: (error) => console.error('Failed to update project:', error),
    onInsertSuccess: refreshNavigation,
    onInsertError: (error) => console.error('Failed to insert project:', error)
  });

  // Custom row updating handler to deal with client contact information
  const handleProjectRowUpdating = async (e: any) => {
    // If clientGuid is changed, fetch the client contact details
    if (e.newData.clientGuid) {
      try {
        const clientDetails = await fetchClientDetails(e.newData.clientGuid);
        if (clientDetails) {
          // Add client contact information to the project update
          e.newData.clientContactName = clientDetails.clientContactName;
          e.newData.clientContactNumber = clientDetails.clientContactNumber;
          e.newData.clientContactEmail = clientDetails.clientContactEmail;
          // Add client description for the lookup optimization
          e.newData.clientDescription = `${clientDetails.number} - ${clientDetails.description}`;
        }
      } catch (error) {
        console.error('Error updating client contact information:', error);
      }
    }
    
    // Use the standard handler for the update
    return handleRowUpdating(e);
  };

  // Custom row inserting handler to deal with client contact information
  const handleProjectRowInserting = async (e: any) => {
    // If clientGuid is provided, fetch the client contact details
    if (e.data.clientGuid) {
      try {
        const clientDetails = await fetchClientDetails(e.data.clientGuid);
        if (clientDetails) {
          // Add client contact information to the new project
          e.data.clientContactName = clientDetails.clientContactName;
          e.data.clientContactNumber = clientDetails.clientContactNumber;
          e.data.clientContactEmail = clientDetails.clientContactEmail;
          // Add client description for the lookup optimization
          e.data.clientDescription = `${clientDetails.number} - ${clientDetails.description}`;
        }
      } catch (error) {
        console.error('Error adding client contact information:', error);
      }
    }
    
    // Use the standard handler for the insert
    return handleRowInserting(e);
  };

  const handleRowValidating = useGridValidation([
    { field: 'projectNumber', required: true, maxLength: 2, errorText: 'Project Number must be at most 2 characters' },
    { field: 'name', required: true, maxLength: 200, errorText: 'Project Name is required and must be at most 200 characters' },
    { field: 'clientGuid', required: true, errorText: 'Client is required' }
  ]);

  const handleInitNewRow = (e: any) => {
    e.data = {
      guid: uuidv4(),
      projectNumber: nextProjectNumber,
      projectStatus: 'TenderInProgress' // Default status
    };
    refreshNextNumber();
  };

  return (
    <React.Fragment>
        <ODataGrid
          title="Projects"
          endpoint={endpoint}
          columns={projectColumns}
          keyField="guid"
          onRowUpdating={handleProjectRowUpdating}
          onRowInserting={handleProjectRowInserting}
          onInitNewRow={handleInitNewRow}
          onRowValidating={handleRowValidating}
          onRowRemoving={handleRowRemoving}
        />
        <div className="bottom-spacer"></div>
    </React.Fragment>
  );
};

export default Projects;
