import React, { useState, useEffect } from 'react';
import './project-profile.scss';
import Form from 'devextreme-react/form';
import type { IGroupItemProps } from 'devextreme-react/form';
import { useParams } from 'react-router-dom';
import { getProjectDetails, ProjectDetails, updateProject } from '../../services/project-service';
import { useAuth } from '../../contexts/auth';
import Button from 'devextreme-react/button';
import notify from 'devextreme/ui/notify';
import { projectStatuses } from '../projects/project-statuses';
import { useScreenSize } from '../../utils/media-query';

const getStatusDisplayName = (statusId: string) => {
  const status = projectStatuses.find(s => s.id === statusId);
  return status ? status.name : statusId;
};

export default function ProjectProfile() {
  const { projectId } = useParams<{ projectId: string }>();
  const [projectData, setProjectData] = useState<ProjectDetails | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formRef, setFormRef] = useState<Form | null>(null);
  const { user } = useAuth();
  const { isXSmall, isSmall } = useScreenSize();

  useEffect(() => {
    const fetchProjectData = async () => {
      if (user?.token && projectId) {
        try {
          const data = await getProjectDetails(projectId, user.token);
          setProjectData(data);
        } catch (error) {
          console.error('Error fetching project data:', error);
          notify('Error loading project data', 'error', 3000);
        }
      }
    };
    fetchProjectData();
  }, [projectId, user?.token]);

  const handleSave = async () => {
    if (!formRef || !projectData || !user?.token) return;

    try {
      const formData = formRef.instance.option('formData');
      const result = await updateProject(projectId!, formData, user.token);
      if (result) {
        setProjectData(result);
        setIsEditing(false);
        notify('Project updated successfully', 'success', 3000);
      }
    } catch (error) {
      console.error('Error updating project:', error);
      notify('Error updating project', 'error', 3000);
    }
  };

  if (!projectData) {
    return <div>Loading...</div>;
  }

  const formItems: IGroupItemProps[] = [{
    itemType: 'group',
    caption: 'Project Information',
    colCountByScreen: {
      xs: 1,    // Mobile phones
      sm: 1,    // Tablets (portrait)
      md: 2,    // Tablets (landscape) / small laptops
      lg: 2     // Large screens
    },
    items: [
      { 
        itemType: 'simple',
        dataField: 'projectNumber',
        editorOptions: { readOnly: true }
      },
      {
        itemType: 'simple',
        dataField: 'name',
        editorOptions: { readOnly: !isEditing }
      },
      {
        itemType: 'simple',
        dataField: 'projectStatus',
        editorOptions: { readOnly: !isEditing }
      }
    ]
  },
  {
    itemType: 'group',
    caption: 'Client Information',
    colCountByScreen: {
      xs: 1,    // Mobile phones
      sm: 1,    // Tablets (portrait)
      md: 2,    // Tablets (landscape) / small laptops
      lg: 2     // Large screens
    },
    items: [
      {
        itemType: 'simple',
        dataField: 'clientNumber',
        editorOptions: { readOnly: !isEditing }
      },
      {
        itemType: 'simple',
        dataField: 'clientContact',
        editorOptions: { readOnly: !isEditing }
      },
      {
        itemType: 'simple',
        dataField: 'purchaseOrderNumber',
        editorOptions: { readOnly: !isEditing }
      }
    ]
  }];

  return (
    <React.Fragment>
      <h2 className={'content-block'}>{projectData.projectNumber} - {projectData.name}</h2>

      <div className={'content-block dx-card responsive-paddings project-summary-card'}>
        <div className={'project-summary-compact'}>
          <div className={'status-section'}>
            <span className={'label'}>Status:</span>
            <span className={'value'}>{getStatusDisplayName(projectData.projectStatus)}</span>
          </div>
          <div className={'dates-section'}>
            <span className={'date-item'}>
              <span className={'label'}>Created:</span>
              <span className={'value'}>{new Date(projectData.created).toLocaleDateString()}</span>
            </span>
            {projectData.updated && (
              <span className={'date-item'}>
                <span className={'label'}>Updated:</span>
                <span className={'value'}>{new Date(projectData.updated).toLocaleDateString()}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className={'content-block dx-card responsive-paddings'}>
        <Form
          ref={(ref) => setFormRef(ref)}
          formData={projectData}
          labelLocation={'top'}
          items={formItems}
        />
        <div className={`form-actions${isXSmall ? ' form-actions-small' : ''}`}>
          <Button
            text={isEditing ? "Cancel" : "Edit"}
            type={isEditing ? "normal" : "default"}
            stylingMode="contained"
            onClick={() => setIsEditing(!isEditing)}
          />
          {isEditing && (
            <Button
              text="Save"
              type="success"
              stylingMode="contained"
              onClick={handleSave}
              className="save-button"
            />
          )}
        </div>
      </div>
    </React.Fragment>
  );
}
