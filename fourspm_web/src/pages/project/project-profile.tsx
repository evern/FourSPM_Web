import React, { useRef, useCallback, useMemo, useEffect } from 'react';
import './project-profile.scss';
import { useParams } from 'react-router-dom';
import { ScrollView } from 'devextreme-react/scroll-view';
import { LoadPanel } from 'devextreme-react/load-panel';
import Form from 'devextreme-react/form';
import { useScreenSize } from '../../utils/media-query';
import { createProjectFormItems } from './project-profile-items';
import { Project } from '../../types/index';
import Button from 'devextreme-react/button';
import { createPortal } from 'react-dom';
import { ProjectProfileProvider, useProjectProfile } from '../../contexts/project-profile/project-profile-context';
import { useClientDataProvider } from '../../hooks/data-providers/useClientDataProvider';

// Define URL parameters interface
export interface ProjectProfileParams {
  projectId?: string;
}

// Main component that provides the context
const ProjectProfile: React.FC = () => {
  // Get projectId from URL parameters
  const { projectId = '' } = useParams<ProjectProfileParams>();
  
  return (
    <ProjectProfileProvider projectId={projectId}>
      <ProjectProfileContent />
    </ProjectProfileProvider>
  );
};

// Content component that uses the context
const ProjectProfileContent: React.FC = () => {
  const { 
    state: { project, isLoading, isSaving, isEditing, error },
    formRef, 
    setFormRef, 
    startEditing, 
    cancelEditing, 
    saveProject,
    handleClientSelectionChange
  } = useProjectProfile();
  
  const { isXSmall, isSmall } = useScreenSize();
  const isMobile = isXSmall || isSmall;
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Use the client data provider for client selection options
  const { clients, isLoading: isClientLoading } = useClientDataProvider();
  
  /**
   * Custom save handler that uses the context saveProject method
   */
  const handleSave = useCallback(async () => {
    try {
      if (project) {
        // Use the form instance to get the updated data
        const formData = formRef.current?.instance?.option('formData');
        await saveProject(formData);
      }
    } catch (error) {
      // Error handling is done inside the context
    }
  }, [project, saveProject, formRef]);
  
  /**
   * Custom cancel handler that ensures proper form reset
   */
  const handleCancel = useCallback(() => {
    cancelEditing();
    
    // Make sure scrollview is at the top after cancel
    if (scrollViewRef.current) {
      scrollViewRef.current.instance.scrollTo(0);
    }
  }, [cancelEditing]);
  
  // Effect to ensure client contact fields are updated after project load
  // This is critical to solve the issue with empty client fields on initial load
  useEffect(() => {
    if (project && formRef.current?.instance && !isEditing && !isLoading) {
      // Update the form with client data to ensure fields are displayed correctly
      // This ensures the form reflects all the loaded data
      formRef.current.instance.updateData(project);
    }
  }, [project, isEditing, isLoading]);

  // Ensure we have a proper project data object with all fields, even during loading
  // This prevents layout shifts that cause flickering
  const projectData = useMemo(() => {
    return project || { 
      guid: '',
      projectNumber: '',
      name: '',
      clientGuid: '',
      clientName: '',
      // Nested client object structure for the form fields
      client: {
        guid: '',
        description: '',
        name: '',
        number: '',
        clientContactName: '',
        clientContactEmail: '',
        clientContactNumber: ''
      },
      projectStatus: 'TenderInProgress',
      // Adding the missing required fields from Project type
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      description: '',
      progressStart: null,
      purchaseOrderNumber: ''
    } as Project;
  }, [project]); // Re-create when project changes
  
  const formItems = useMemo(() => createProjectFormItems(
    projectData,
    isEditing,
    handleClientSelectionChange,
    isClientLoading,
    clients
  ), [projectData, isEditing, handleClientSelectionChange, isClientLoading, clients]);
  
  const titleText = projectData && projectData.projectNumber && projectData.name
    ? `${projectData.projectNumber} - ${projectData.name}` 
    : project?.guid 
      ? `Project ${project.guid}` 
      : 'New Project';

  // If an error occurred while loading project, show error message
  if (error) {
    // Safely extract error message regardless of type
    const errorMessage = typeof error === 'object' && error !== null
      ? (error as any).message || 'An unknown error occurred'
      : String(error);
      
    return (
      <div className="error-message">
        <h3>Error Loading Project</h3>
        <p>{errorMessage}</p>
      </div>
    );
  }

  // If we're loading, show only the loading panel without content to avoid flash of unloaded content
  if (isLoading) {
    return (
      <div className="profile-container profile-loading-container">
        <LoadPanel
          visible={true}
          message="Loading project..."
          position={{ of: window, my: 'center', at: 'center' }}
          showIndicator={true}
          shading={true}
        />
      </div>
    );
  }
  
  return (
    <div className="profile-container">
      {/* Show loading panel only when saving to avoid UI flicker */}
      <LoadPanel 
        visible={isSaving} 
        message="Saving..."
        position={{ of: window, my: 'center', at: 'center' }}
        showIndicator={true}
        shading={true}
      />
      
      {/* Conditionally render floating action buttons only on mobile */}
      {isMobile && createPortal(
        <div className="floating-action-buttons-portal">
          {!isEditing ? (
            <Button
              text=""
              icon="edit"
              type="default"
              stylingMode="contained"
              onClick={startEditing}
            />
          ) : (
            <div className="action-button-group">
              <Button
                text=""
                icon="save"
                type="success"
                stylingMode="contained"
                onClick={handleSave}
                disabled={isSaving}
              />
              <Button
                text=""
                icon="close"
                type="normal"
                stylingMode="contained"
                onClick={handleCancel}
                disabled={isSaving}
              />
            </div>
          )}
        </div>,
        document.body
      )}

      <div className="page-header">
        <h1 className="project-title">{titleText}</h1>
      </div>

      <ScrollView 
        ref={scrollViewRef}
        className="profile-scrollview"
        height={isSmall ? 'calc(100vh - 130px)' : 'auto'}
      >
        <div className="profile-form">
          {/* Edit button inline with project information - desktop only */}
          {!isMobile && !isEditing && (
            <div className="inline-edit-button">
              <Button
                text="Edit"
                type="default"
                stylingMode="contained"
                onClick={startEditing}
                icon="edit"
              />
            </div>
          )}

          {/* Save/Cancel buttons in the same position when editing - desktop only */}
          {!isMobile && isEditing && (
            <div className="inline-edit-button">
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  text="Save"
                  icon="save"
                  type="success"
                  stylingMode="contained"
                  onClick={handleSave}
                  disabled={isSaving}
                />
                <Button
                  text="Cancel"
                  icon="close"
                  type="normal"
                  stylingMode="contained"
                  onClick={handleCancel}
                  disabled={isSaving}
                />
              </div>
            </div>
          )}
          
          {/* Use a key prop to force Form to completely re-render when editing state changes */}
          <Form
            key={`project-form-${isEditing ? 'edit' : 'view'}-${project?.guid || 'new'}`}
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

