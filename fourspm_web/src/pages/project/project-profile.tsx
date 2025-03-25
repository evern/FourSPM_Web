import React, { useRef, useCallback } from 'react';
import './project-profile.scss';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/auth';
import { ScrollView } from 'devextreme-react/scroll-view';
import { LoadPanel } from 'devextreme-react/load-panel';
import Form from 'devextreme-react/form';
import { useProjectEntityController } from '../../hooks/controllers/useProjectController';
import { useScreenSize } from '../../utils/media-query';
import { useNavigation } from '../../contexts/navigation';
import { createProjectFormItems } from './project-profile-items';
import { Project } from '../../types/index';
import Toolbar, { Item } from 'devextreme-react/toolbar';

// Define URL parameters interface
export interface ProjectProfileParams {
  projectId: string;
}

const ProjectProfile: React.FC = () => {
  // Get projectId from URL parameters
  const { projectId = '' } = useParams<ProjectProfileParams>();
  const { user } = useAuth();
  const { refreshNavigation } = useNavigation();
  const { isXSmall, isSmall } = useScreenSize();
  const scrollViewRef = useRef<ScrollView>(null);

  // Use enhanced project entity hook with standardized naming
  const { 
    isUpdating, 
    isSaving, 
    onFormRef, 
    startUpdate, 
    cancelUpdate, 
    saveEntity,
    updateProjectClient,
    entity
  } = useProjectEntityController(projectId, user?.token);
  
  // Handle client selection change event (adapter for the form)
  const handleClientSelectionChange = useCallback((e: any) => {
    // Get selected clientId from the event value
    const clientId = e.value;
    
    if (clientId && updateProjectClient) {
      updateProjectClient(clientId);
    }
  }, [updateProjectClient]);

  // If project is still loading, show loading indicator
  if (entity.isLoading) {
    return (
      <div className="profile-loading">
        <LoadPanel 
          visible={true} 
          showIndicator={true} 
          showPane={true} 
          shading={true}
          position={{ of: '.profile-loading' }}
        />
      </div>
    );
  }

  const projectData = entity.data || {} as Project;

  // Create form items for the current project data, passing entity and loading state
  const formItems = createProjectFormItems(
    projectData, 
    Boolean(isUpdating), 
    handleClientSelectionChange,
    false // isLoadingClient parameter
  );

  return (
    <div className="profile-container">
      <LoadPanel 
        visible={isSaving} 
        message="Saving..." 
        position={{ of: '.profile-container' }}
        showIndicator={true}
      />
      
      <div className="profile-header">
        <h2>
          {projectData?.projectNumber && projectData?.name ? 
            `Project ${projectData.projectNumber} - ${projectData.name}` : 
            'New Project'}
        </h2>
      </div>

      <ScrollView 
        ref={scrollViewRef}
        className="profile-scrollview"
        height={isSmall ? 'calc(100vh - 130px)' : 'auto'}
      >
        <div className="profile-form">
          <Form
            ref={onFormRef}
            formData={projectData}
            readOnly={!isUpdating}
            showValidationSummary={true}
            validationGroup="projectData"
            items={formItems}
          />
          
          <Toolbar className="profile-toolbar">
            <Item
              location="after"
              widget="dxButton"
              visible={!isUpdating}
              options={{
                text: 'Edit',
                type: 'default',
                stylingMode: 'contained',
                onClick: startUpdate,
              }}
            />
            <Item
              location="after"
              widget="dxButton"
              visible={isUpdating}
              options={{
                text: 'Cancel',
                stylingMode: 'outlined',
                onClick: cancelUpdate,
              }}
            />
            <Item
              location="after"
              widget="dxButton"
              visible={isUpdating}
              options={{
                text: 'Save',
                type: 'default',
                stylingMode: 'contained',
                onClick: () => {
                  if (projectData) {
                    saveEntity(projectData).then(() => {
                      // Update navigation to reflect changes
                      if (refreshNavigation) refreshNavigation();
                    });
                  }
                },
              }}
            />
          </Toolbar>
        </div>
      </ScrollView>
    </div>
  );
};

export default ProjectProfile;
