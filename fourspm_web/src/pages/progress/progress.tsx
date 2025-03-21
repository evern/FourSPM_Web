import React from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/auth';
import './progress.scss';

// Import custom hooks from shared location
import { useProjectInfo } from '../../hooks/useProjectInfo';
import { useDeliverableGates } from '../../hooks/useDeliverableGates';
import { useProgressHandlers } from './hooks/useProgressHandlers';

// Import components from shared location
import ProjectHeader from '../../components/ProjectHeader';
import ProgressGrid from '../../components/ProgressGrid';

// Import types from shared location
import { ProgressParams } from '../../types/progress';

const Progress: React.FC = () => {
  // Extract project ID from URL params
  const { projectId } = useParams<ProgressParams>();
  const { user } = useAuth();
  
  // Fetch project information
  const { 
    project, 
    currentPeriod, 
    isLoading: isLoadingProject 
  } = useProjectInfo(projectId, user?.token);
  
  // Fetch deliverable gates
  const { 
    deliverableGates, 
    isLoadingGates 
  } = useDeliverableGates(user?.token);
  
  // Set up row updating and validation handlers
  const { 
    handleRowUpdating, 
    handleRowValidating 
  } = useProgressHandlers(deliverableGates, currentPeriod, user?.token);
  
  // Debug logs to help troubleshoot API issues
  console.log('Progress Component - Initial Render:', {
    projectId,
    hasToken: !!user?.token
  });

  return (
    <div className="progress-container">
      <div className="custom-grid-wrapper">
        <div className="grid-custom-title">
          {project ? `${project.projectNumber} - ${project.name} Progress Tracking` : 'Progress Tracking'}
        </div>
        
        {/* Project header with period info */}
        {project && (
          <ProjectHeader 
            project={project} 
            currentPeriod={currentPeriod} 
          />
        )}
        
        {/* Progress tracking grid - has its own loading indicator */}
        <ProgressGrid
          projectId={projectId}
          onRowUpdating={handleRowUpdating}
          onRowValidating={handleRowValidating}
        />
      </div>
    </div>
  );
};

export default Progress;
