import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { API_CONFIG } from '../../config/api';
import { useAuth } from '../../contexts/auth';
import { ODataGrid } from '../../components/ODataGrid/ODataGrid';
import './progress.scss';

// Import progress columns
import { progressColumns } from './progress-columns';
import { handleProgressUpdate } from './progress-store';
import { compareGuids } from '../../utils/guid-utils';

// Import interfaces
interface ProgressParams {
  projectId: string;
}

interface ProjectInfo {
  projectNumber: string;
  name: string;
  progressStart: Date;
}

interface DeliverableGate {
  guid: string;
  name: string;
  maxPercentage: number;
  autoPercentage: number | null;
}

const Progress: React.FC = () => {
  const { projectId } = useParams<ProgressParams>();
  const { user } = useAuth();
  const [project, setProject] = useState<ProjectInfo | null>(null);
  const [currentPeriod, setCurrentPeriod] = useState<number>(1);
  const [deliverableGates, setDeliverableGates] = useState<DeliverableGate[]>([]);
  const [isLoadingGates, setIsLoadingGates] = useState<boolean>(true);

  // Helper function to validate progress percentage against period constraints
  const validateProgressPercentage = (deliverable: any, newPercentage: number) => {
    // Only validate if we have total hours
    const totalHours = deliverable.totalHours || 0;
    if (totalHours <= 0) return { valid: true };
    
    // Get the current gate
    const currentGate = deliverableGates.find(gate => 
      compareGuids(gate.guid, deliverable.deliverableGateGuid)
    );
    if (!currentGate) {
      return { 
        valid: false, 
        errorText: 'Current gate not found' 
      };
    }
    
    // Use progress items from the deliverable entity (already available)
    const progressItems = deliverable.progressItems || [];
    
    // Separate progress items into previous, current, and future periods
    const previousItems = progressItems.filter(item => item.period < currentPeriod);
    const futureItems = progressItems.filter(item => item.period > currentPeriod);
    
    // Calculate minimum percentage based on previous periods
    const previousUnits = previousItems.reduce((sum, item) => sum + item.units, 0);
    const minPercentage = previousUnits / totalHours;
    
    // Calculate maximum percentage (considering both gate max and future commitments)
    let maxPercentage = currentGate.maxPercentage;
    
    // If there are future committed units, they constrain our maximum
    const futureUnits = futureItems.reduce((sum, item) => sum + item.units, 0);
    if (futureUnits > 0) {
      const futureCommitted = futureUnits / totalHours;
      const remainingPercentage = 1 - futureCommitted;
      maxPercentage = Math.min(maxPercentage, remainingPercentage);
    }
    
    // Validate against min percentage (can't go below what's already reported)
    if (newPercentage < minPercentage) {
      return {
        valid: false,
        errorText: `Total earned percentage (${(newPercentage * 100).toFixed(2)}%) cannot be less than what's already reported in previous periods (${(minPercentage * 100).toFixed(2)}%).`
      };
    }
    
    // Validate against max percentage
    if (newPercentage > maxPercentage) {
      return {
        valid: false,
        errorText: `Total earned percentage (${(newPercentage * 100).toFixed(2)}%) exceeds the maximum allowed (${(maxPercentage * 100).toFixed(2)}%) for this gate.`
      };
    }
    
    return { valid: true };
  };

  // Handle row validation (for all fields)
  const handleRowValidating = (e: any) => {
    // Only validate if new data exists
    if (!e.newData) return;

    // Create a merged row data for validation
    const rowData = { ...e.oldData, ...e.newData };

    // Validate totalPercentageEarnt if it was changed
    if (e.newData.totalPercentageEarnt !== undefined) {
      // Make sure the value is in the correct range (0-1)
      let percentValue = e.newData.totalPercentageEarnt;
      
      // If value is greater than 1, assume it's been entered as a percentage (0-100) and convert
      if (percentValue > 1) {
        percentValue = percentValue / 100;
      }
      
      // Clamp value between 0 and 1
      percentValue = Math.max(0, Math.min(1, percentValue));
      
      // Update the newData with the corrected value
      e.newData.totalPercentageEarnt = percentValue;
      
      // Validate the percentage against period constraints
      const validationResult = validateProgressPercentage(rowData, percentValue);
      if (!validationResult.valid) {
        e.isValid = false;
        e.errorText = validationResult.errorText || 'Validation error occurred';
      }
    }

    // Check gate changes
    if (e.newData.deliverableGateGuid !== undefined) {
      // Find the selected deliverable gate using the utility function
      const selectedGate = deliverableGates.find(gate => 
        compareGuids(gate.guid, e.newData.deliverableGateGuid)
      );

      if (!selectedGate) {
        // Instead of failing, just log a warning
        console.warn('Selected gate not found, using default values');
        return;
      }

      // If gate has an auto percentage, set it in the new data
      if (selectedGate.autoPercentage !== null) {
        const newPercentage = selectedGate.autoPercentage;
        
        // Validate the percentage against period constraints
        const validationResult = validateProgressPercentage(rowData, newPercentage);
        if (!validationResult.valid) {
          e.isValid = false;
          e.errorText = validationResult.errorText || 'Validation error occurred';
        }
      }
    }
  };

  // Handle row updating event to manage progress updates
  const handleRowUpdating = (e: any) => {
    console.log('Row updating:', e);
    
    // Check if we're updating totalPercentageEarnt
    if (e.newData.totalPercentageEarnt !== undefined) {
      // Get the deliverable key
      const deliverableKey = e.key;
      
      // Use custom handler for progress updates
      const result = handleProgressUpdate(deliverableKey, e.newData, currentPeriod, e.oldData);
      
      // Returning a Promise will make DevExtreme wait for it to resolve
      e.cancel = true;
      return result.then(() => {
        // Manually reload the grid after update
        if (e.component) {
          // Refresh the grid to update data
          e.component.refresh();
          
          // Exit edit mode explicitly
          e.component.cancelEditData();
        }
      }).catch(error => {
        console.error('Error updating progress:', error);
      });
    } else if (e.newData.deliverableGateGuid !== undefined) {
      // Handle deliverable gate change
      e.cancel = true;
      
      // Find the selected deliverable gate
      const selectedGate = deliverableGates.find(gate => 
        compareGuids(gate.guid, e.newData.deliverableGateGuid)
      );
      
      // Prepare the update data
      const updateData: any = {
        deliverableGateGuid: e.newData.deliverableGateGuid
      };
      
      // If gate has an auto percentage, update it as well
      if (selectedGate && selectedGate.autoPercentage !== null) {
        updateData.totalPercentageEarnt = selectedGate.autoPercentage;
      }
      
      // Update the entity
      return fetch(`${API_CONFIG.baseUrl}/odata/v1/Deliverables(${e.key})`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      }).then(response => {
        if (!response.ok) {
          throw new Error('Failed to update deliverable gate');
        }
        
        // Refresh the grid
        if (e.component) {
          e.component.refresh();
          e.component.cancelEditData();
        }
      }).catch(error => {
        console.error('Error updating deliverable gate:', error);
      });
    } else {
      // For other fields, let default handler work
      console.log('Using default update handler for', Object.keys(e.newData));
      return true;
    }
  };

  // Debug logs to help troubleshoot API issues
  console.log('Progress Component - Initial Render:', {
    projectId,
    hasToken: !!user?.token
  });

  // Fetch project info when component mounts
  useEffect(() => {
    const fetchProjectInfo = async () => {
      if (!user?.token || !projectId) return;
      
      try {
        const response = await fetch(`${API_CONFIG.baseUrl}/odata/v1/Projects(${projectId})`, {
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // Set project information
          const projectInfo = {
            projectNumber: data.projectNumber || '',
            name: data.name || '',
            progressStart: data.progressStart ? new Date(data.progressStart) : new Date()
          };
          
          setProject(projectInfo);
          
          // Calculate current reporting period based on project start date
          if (projectInfo.progressStart) {
            const period = calculateCurrentPeriod(projectInfo.progressStart);
            setCurrentPeriod(period);
            console.log(`Current reporting period: ${period}`);
          }
        } else {
          console.error('Failed to fetch project info:', await response.text());
        }
      } catch (error) {
        console.error('Error fetching project info:', error);
      }
    };
    
    fetchProjectInfo();
  }, [projectId, user?.token]);

  // Fetch deliverable gates when component mounts
  useEffect(() => {
    const fetchDeliverableGates = async () => {
      if (!user?.token) return;
      
      setIsLoadingGates(true);
      try {
        const response = await fetch(`${API_CONFIG.baseUrl}/odata/v1/DeliverableGates`, {
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          // Handle both array response format and OData format with 'value' property
          const gates = Array.isArray(data) ? data : (data.value || []);
          setDeliverableGates(gates);
          console.log('Fetched deliverable gates:', gates);
        } else {
          console.error('Failed to fetch deliverable gates:', await response.text());
        }
      } catch (error) {
        console.error('Error fetching deliverable gates:', error);
      } finally {
        setIsLoadingGates(false);
      }
    };
    
    fetchDeliverableGates();
  }, [user?.token]);

  const calculateCurrentPeriod = (projectStartDate: Date): number => {
    const start = new Date(projectStartDate);
    const today = new Date();
    
    // Calculate the number of months between the start date and today
    const months = (today.getFullYear() - start.getFullYear()) * 12 + today.getMonth() - start.getMonth();
    // Add 1 since periods are 1-based, not 0-based
    return months + 1;
  };

  return (
    <div className="progress-container">
      <div className="period-selector">
        <div className="period-info">
          <span>Reporting Period: </span>
          <strong>{currentPeriod}</strong>
        </div>
        <div className="period-date">
          <span>As of: </span>
          <strong>{new Date().toLocaleDateString()}</strong>
        </div>
      </div>
      
      {project && (
        <div className="project-info">
          <h2>
            {project.projectNumber} - {project.name}
          </h2>
        </div>
      )}
      
      {isLoadingGates ? (
        <div>Loading deliverable gates...</div>
      ) : (
        <ODataGrid
          title="Progress Tracking"
          endpoint={`${API_CONFIG.baseUrl}/odata/v1/Deliverables`}
          columns={progressColumns}
          keyField="guid"
          onRowUpdating={handleRowUpdating}
          onRowValidating={handleRowValidating}
          defaultFilter={[['projectGuid', '=', projectId]]}
          allowUpdating={true}
          allowAdding={false}
          allowDeleting={false}
        />
      )}
    </div>
  );
};

export default Progress;
