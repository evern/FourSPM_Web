import React, { useRef, useCallback, useEffect } from 'react';
import './project-profile.scss';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/auth';
import { ScrollView } from 'devextreme-react/scroll-view';
import { LoadPanel } from 'devextreme-react/load-panel';
import Form from 'devextreme-react/form';
import { useProjectEntityController } from '../../hooks/controllers/useProjectEntityController';
import { useScreenSize } from '../../utils/media-query';
import { useNavigation } from '../../contexts/navigation';
import { createProjectFormItems } from './project-profile-items';
import { Project } from '../../types/index';
import Button from 'devextreme-react/button';
import notify from 'devextreme/ui/notify';
import { updateProject } from '../../adapters/project.adapter';

// Define URL parameters interface
export interface ProjectProfileParams {
  projectId?: string;
}

const ProjectProfile: React.FC = () => {
  // Get projectId from URL parameters
  const { projectId = '' } = useParams<ProjectProfileParams>();
  const { user } = useAuth();
  const { refreshNavigation } = useNavigation();
  const { isXSmall, isSmall } = useScreenSize();
  const scrollViewRef = useRef<ScrollView>(null);

  // Use enhanced project entity controller with integrated form operations
  const { 
    // Entity state and operations
    entity,
    
    // Form operations
    setFormRef,
    isEditing,
    isSaving,
    startEditing,
    cancelEditing,
    saveForm,
    loadEntity,
    
    // Client data and operations
    clients,
    isClientLoading,
    handleClientSelectionChange
  } = useProjectEntityController(projectId, {
    onUpdateSuccess: () => {
      // Update navigation to reflect changes
      if (refreshNavigation) refreshNavigation();
    }
  });
  
  // Add debugging for isEditing state
  useEffect(() => {
    console.log('isEditing state changed:', isEditing);
  }, [isEditing]);

  /**
   * Custom save handler that uses the form operations
   * 
   * NOTE: DevExtreme SelectBox components with async data sources (like the client field)
   * have a known issue with not maintaining proper state after form operations.
   * 
   * Issues addressed:
   * 1. When client data is changed, related fields (contacts, etc.) need updating
   * 2. When clearing the client (setting to null), the old client data persists in the UI
   * 3. The client lookup control requires complete entity refresh to display properly
   * 
   * Solution: Reload the entire entity after saving to ensure all data displays correctly,
   * including properly clearing client data when it's been set to null
   */
  const handleSave = useCallback(async () => {
    if (!projectId) return;
    
    try {
      // Directly use the saveForm method from our controller
      const result = await saveForm(projectId, 
        (id, data) => updateProject(id, data, user?.token || ''));
        
      if (result) {
        // Refresh navigation if needed
        if (refreshNavigation) refreshNavigation();
      }
    } catch (error) {
      notify('Error saving project', 'error', 3000);
    }
  }, [projectId, saveForm, user?.token, refreshNavigation]);
  
  /**
   * Custom cancel handler that ensures proper form reset
   * 
   * This uses the enhanced cancelEditing from our form operations hook that properly
   * handles complex fields with async data sources like client selection
   */
  const handleCancel = useCallback(() => {
    // Call the enhanced cancelEditing function which handles form reset with original data
    cancelEditing();
  }, [cancelEditing]);

  // If project is still loading, show loading indicator
  if (entity.isLoading) {
    return (
      <div className="profile-loading">
        <LoadPanel 
          visible={true} 
          showIndicator={true} 
          showPane={true} 
          shading={true}
          position={{ of: window, my: 'center', at: 'center' }}
        />
      </div>
    );
  }

  // If error occurred while loading project
  if (entity.error) {
    // Safely extract error message regardless of type
    const errorMessage = typeof entity.error === 'object' && entity.error !== null
      ? (entity.error as any).message || 'An unknown error occurred'
      : String(entity.error);
      
    return (
      <div className="error-message">
        <h3>Error Loading Project</h3>
        <p>{errorMessage}</p>
      </div>
    );
  }

  // Ensure we have a proper project data object with all fields
  const projectData = entity.data ? { ...entity.data } : {} as Project;

  // Create form items for the current project data, passing entity and loading state
  const formItems = createProjectFormItems(
    projectData, 
    Boolean(isEditing), 
    handleClientSelectionChange,
    isClientLoading,
    clients
  );

  return (
    <div className="profile-container">
      <LoadPanel 
        visible={isSaving} 
        message="Saving..." 
        position={{ of: window, my: 'center', at: 'center' }}
        showIndicator={true}
      />
      
      <div className="grid-header-container">
        <div className="grid-custom-title">
          {projectData ? `${projectData.projectNumber} - ${projectData.name}` : 
            projectId ? `Project ${projectId}` : 
            'New Project'}
        </div>
        
        <div className="action-buttons">
          {!isEditing ? (
            <Button
              text="Edit"
              type="default"
              stylingMode="contained"
              onClick={startEditing}
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
                onClick={handleCancel}
                disabled={isSaving}
              />
            </div>
          )}
        </div>
      </div>

      <ScrollView 
        ref={scrollViewRef}
        className="profile-scrollview"
        height={isSmall ? 'calc(100vh - 130px)' : 'auto'}
      >
        <div className="profile-form">
          <Form
            formData={projectData}
            readOnly={!isEditing}
            showValidationSummary={true}
            validationGroup="projectData"
            items={formItems}
            ref={setFormRef}
          />
        </div>
      </ScrollView>
    </div>
  );
};

export default ProjectProfile;
