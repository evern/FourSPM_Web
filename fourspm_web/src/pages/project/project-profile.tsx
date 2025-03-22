import React, { useState, useEffect, useRef, useCallback } from 'react';
import './project-profile.scss';
import Form from 'devextreme-react/form';
import { useParams } from 'react-router-dom';
import { getProjectDetails } from '../../services/project.service';
import { ProjectDetails } from '../../types/project';
import { useAuth } from '../../contexts/auth';
import { Button } from 'devextreme-react/button';
import notify from 'devextreme/ui/notify';
import { useScreenSize } from '../../utils/media-query';
import { ScrollView } from 'devextreme-react/scroll-view';
import { LoadPanel } from 'devextreme-react/load-panel';
import { LoadIndicator } from 'devextreme-react/load-indicator';

// Import custom hooks
import { useProjectEdit } from '../../hooks/useProjectEdit';
import { useClientData } from '../../hooks/useClientData';

// Import form items configuration
import { createProjectFormItems } from './project-form-items';

// Define URL parameters interface
interface ProjectProfileParams {
  projectId: string;
}

const ProjectProfile: React.FC = () => {
  // Extract parameters from URL
  const { projectId } = useParams<ProjectProfileParams>();
  const { user } = useAuth();
  
  // Component state
  const [projectData, setProjectData] = useState<ProjectDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true); 
  const { isXSmall, isSmall } = useScreenSize();
  const scrollViewRef = useRef<ScrollView>(null);

  // Use custom hooks
  const { isEditing, isSaving, formRef, onFormRef, startEdit, cancelEdit, saveProjectChanges } = 
    useProjectEdit(projectId, user?.token);
  const { clientDetails, selectedClientContact, isLoadingClient, handleClientChange, loadClientData } = 
    useClientData(user?.token);

  // Handle client selection change event (adapter for the form)
  const handleClientSelectionChange = useCallback(async (e: any) => {
    if (formRef && e.value) {
      await handleClientChange(e.value, formRef);
    }
  }, [formRef, handleClientChange]);

  // Fetch project data on component mount
  useEffect(() => {
    const fetchProjectData = async () => {
      if (user?.token && projectId) {
        setIsLoading(true); 
        try {
          const data = await getProjectDetails(projectId, user.token);
          console.log('Project data loaded:', data);
          console.log('Client data from API:', data.client);
          setProjectData(data);

          if (data.clientGuid) {
            const clientData = await loadClientData(data.clientGuid);
            console.log('Client data loaded separately:', clientData);
          }
        } catch (error) {
          console.error('Error fetching project data:', error);
          notify('Error loading project data', 'error', 3000);
        } finally {
          setIsLoading(false); 
        }
      }
    };
    fetchProjectData();
  }, [projectId, user?.token, loadClientData]);

  // Handle save button click
  const handleSave = useCallback(async () => {
    if (!projectData) return;
    
    const updatedProject = await saveProjectChanges(projectData);
    if (updatedProject) {
      console.log('Project saved, updated data:', updatedProject);
      console.log('Client data after save:', updatedProject.client);
      setProjectData(updatedProject);
      
      // Reload client data if available
      if (updatedProject.clientGuid) {
        const refreshedClient = await loadClientData(updatedProject.clientGuid);
        console.log('Client data refreshed after save:', refreshedClient);
      }
    }
  }, [projectData, saveProjectChanges, loadClientData]);

  // Log projectData changes
  useEffect(() => {
    if (projectData) {
      console.log('ProjectData state updated:', projectData);
      console.log('Client in projectData:', projectData.client);
    }
  }, [projectData]);

  // Loading state
  if (isLoading || !projectData) {
    return (
      <div className="profile-container">
        <div className="custom-grid-wrapper">
          <div className="grid-custom-title">Loading Project Details...</div>
        </div>
        <div className="profile-loading-container">
          <LoadIndicator width={50} height={50} visible={true} />
          <div className="loading-message">Loading project data...</div>
        </div>
      </div>
    );
  }

  // Create form items for the current project data, passing clientDetails and loading state
  const formItems = createProjectFormItems(
    projectData, 
    isEditing, 
    handleClientSelectionChange,
    clientDetails,
    isLoadingClient
  );

  return (
    <div className="profile-container">
      <LoadPanel 
        visible={isSaving} 
        position={{ of: '.profile-container' }}
        showIndicator={true}
        showPane={true}
      />
      
      <div className="custom-grid-wrapper">
        <div className="grid-header-container">
          <div className="grid-custom-title">
            {projectData ? `${projectData.projectNumber} - ${projectData.name}` : 'Project Details'}
          </div>
          
          <div className="action-buttons">
            {!isEditing ? (
              <Button
                text="Edit"
                type="default"
                stylingMode="contained"
                onClick={startEdit}
              />
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  text="Save"
                  type="success"
                  stylingMode="contained"
                  onClick={handleSave}
                  disabled={isSaving}
                />
                <Button
                  text="Cancel"
                  type="normal"
                  stylingMode="contained"
                  onClick={cancelEdit}
                  disabled={isSaving}
                />
              </div>
            )}
          </div>
        </div>

        <ScrollView
          className="scrollable-content"
          ref={scrollViewRef}
          height={"calc(100vh - 200px)"}
          width={"100%"}
        >
          <div className="form-container">
            <Form
              ref={onFormRef}
              formData={projectData}
              items={formItems}
              labelLocation="top"
              minColWidth={233}
              colCount="auto"
            />
          </div>
        </ScrollView>
      </div>
    </div>
  );
};

export default ProjectProfile;
