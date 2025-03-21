import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { API_CONFIG } from '../../config/api';
import { v4 as uuidv4 } from 'uuid';
import { ODataGrid } from '../../components/ODataGrid/ODataGrid';
import { useGridValidation } from '../../hooks/useGridValidation';
import { useGridOperations } from '../../hooks/useGridOperations';
import { createDeliverableColumns } from './deliverable-columns';
import { useAuth } from '../../contexts/auth';
import { fetchProject } from '../../services/project.service';
import { ProjectInfo } from '../../types/project';
import './deliverables.scss';

interface DeliverableParams {
  projectId: string;
}

const Deliverables: React.FC = () => {
  const { projectId } = useParams<DeliverableParams>();
  const { user } = useAuth();
  const endpoint = `${API_CONFIG.baseUrl}/odata/v1/Deliverables`;
  const [gridInstance, setGridInstance] = useState<any>(null);
  const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(null);
  
  console.log('Deliverables Component - Initial Render:', {
    projectId,
    endpoint,
    hasToken: !!user?.token
  });

  // Fetch project info when component mounts
  useEffect(() => {
    const getProjectInfo = async () => {
      if (!user?.token || !projectId) return;
      
      try {
        const project = await fetchProject(projectId, user.token);
        setProjectInfo(project);
      } catch (error) {
        console.error('Error fetching project info:', error);
      }
    };
    
    getProjectInfo();
  }, [projectId, user?.token]);

  const { handleRowUpdating, handleRowRemoving } = useGridOperations({
    endpoint,
    onDeleteError: (error) => console.error('Failed to delete deliverable:', error),
    onUpdateError: (error) => console.error('Failed to update deliverable:', error)
  });

  const handleRowValidating = useGridValidation([
    { 
      field: 'areaNumber', 
      required: true, 
      maxLength: 2,
      pattern: /^[0-9][0-9]$/,
      errorText: 'Area Number must be exactly 2 digits (00-99)' 
    },
    { 
      field: 'discipline', 
      required: true,
      errorText: 'Discipline is required' 
    },
    { 
      field: 'documentType', 
      required: true,
      errorText: 'Document Type is required' 
    },
    { field: 'departmentId', required: true, errorText: 'Department is required' },
    { field: 'deliverableTypeId', required: true, errorText: 'Deliverable Type is required' },
    { field: 'documentTitle', required: true, maxLength: 200, errorText: 'Document Title is required' }
  ]);

  // Function to fetch a suggested internal document number from the server
  const fetchSuggestedDocumentNumber = async (deliverableTypeId: string, areaNumber: string, discipline: string, documentType: string) => {
    if (!user?.token || !projectId || !gridInstance) return;
    
    try {
      // Only proceed if we have the minimum required fields
      // For "Deliverable" type, we need the area number
      if (deliverableTypeId === 'Deliverable' && !areaNumber) {
        return;
      }
      
      // Build the URL with query parameters
      const url = `${API_CONFIG.baseUrl}/odata/v1/Deliverables/SuggestInternalDocumentNumber?projectGuid=${projectId}&deliverableTypeId=${deliverableTypeId}&areaNumber=${areaNumber}&discipline=${discipline}&documentType=${documentType}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.suggestedNumber;
      } else {
        console.error('Failed to fetch suggested document number:', await response.text());
        return '';
      }
    } catch (error) {
      console.error('Error suggesting document number:', error);
      return '';
    }
  };

  const handleInitNewRow = (e: any) => {
    e.data = {
      guid: uuidv4(),
      projectGuid: projectId,
      clientNumber: '',  
      projectNumber: '', 
      areaNumber: '',
      discipline: '',
      documentType: '',
      departmentId: 'Administration',
      deliverableTypeId: 'Task',
      internalDocumentNumber: '',
      clientDocumentNumber: '',
      documentTitle: '',
      budgetHours: 0,
      variationHours: 0,
      totalHours: 0,    
      totalCost: 0,
      bookingCode: ''
    };
  };
  
  // Handle the edit event to inject the field watchers
  const handleEditorPreparing = (e: any) => {
    const { dataField, row, editorOptions } = e;
    
    if (!row) return;
    
    // Setup field change watchers for fields that affect document numbering
    if (['areaNumber', 'discipline', 'documentType', 'deliverableTypeId'].includes(dataField)) {
      const originalValueChanged = editorOptions.onValueChanged;
      
      editorOptions.onValueChanged = async (args: any) => {
        // Call the original handler first
        if (originalValueChanged) {
          originalValueChanged(args);
        }
        
        // Get current values from the row data
        const rowData = row.data;
        const deliverableTypeId = dataField === 'deliverableTypeId' ? args.value : rowData.deliverableTypeId;
        const areaNumber = dataField === 'areaNumber' ? args.value : rowData.areaNumber;
        const discipline = dataField === 'discipline' ? args.value : rowData.discipline;
        const documentType = dataField === 'documentType' ? args.value : rowData.documentType;
        
        // Only attempt to generate a document number if we have enough required fields
        const shouldGenerateNumber = 
          deliverableTypeId && 
          ((deliverableTypeId === 'Deliverable' && areaNumber) || deliverableTypeId !== 'Deliverable') &&
          (discipline || documentType)
        ;
        
        if (shouldGenerateNumber) {
          const suggestedNumber = await fetchSuggestedDocumentNumber(deliverableTypeId, areaNumber, discipline, documentType);
          
          if (suggestedNumber && gridInstance) {
            // Find the cell for internal document number and update it
            gridInstance.cellValue(row.rowIndex, 'internalDocumentNumber', suggestedNumber);
          }
        }
      };
    }
  };
  
  // Save grid instance for later use
  const handleGridInitialized = (e: any) => {
    setGridInstance(e.component);
  };

  // Create columns with the current projectId to filter areas
  const columns = createDeliverableColumns(projectId);

  return (
    <div className="deliverables-container">
      <div className="custom-grid-wrapper">
        <div className="grid-custom-title">{projectInfo ? `${projectInfo.projectNumber} - ${projectInfo.name} Deliverables` : 'Deliverables'}</div>
        <ODataGrid
          title=" "
          endpoint={endpoint}
          columns={columns}
          keyField="guid"
          onRowUpdating={handleRowUpdating}
          onInitNewRow={handleInitNewRow}
          onRowValidating={handleRowValidating}
          onRowRemoving={handleRowRemoving}
          onEditorPreparing={handleEditorPreparing}
          onInitialized={handleGridInitialized}
          defaultFilter={[["projectGuid", "=", projectId]]}
        />
      </div>
    </div>
  );
};

export default Deliverables;
