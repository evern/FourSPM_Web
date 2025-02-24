import React, { useState, useEffect } from 'react';
import './project-profile.scss';
import Form, { SimpleItem, GroupItem } from 'devextreme-react/form';
import { useParams } from 'react-router-dom';
import { getProjectDetails, ProjectDetails, updateProject } from '../../services/project-service';
import { useAuth } from '../../contexts/auth';
import { dxFormGroupItem } from 'devextreme/ui/form';
import Button from 'devextreme-react/button';
import notify from 'devextreme/ui/notify';

export default function ProjectProfile() {
  const { projectId } = useParams<{ projectId: string }>();
  const [projectData, setProjectData] = useState<ProjectDetails | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formRef, setFormRef] = useState<Form | null>(null);
  const { user } = useAuth();

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

  const formItems: dxFormGroupItem[] = [{
    itemType: 'group',
    caption: 'Project Information',
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

      <div className={'content-block dx-card responsive-paddings'}>
        <div className={'project-summary'}>
          <div className={'project-header'}>
            <div className={'project-status'}>
              <h3>Project Status</h3>
              <div className={'status-value'}>
                {projectData.projectStatus}
              </div>
            </div>
            <div className={'project-dates'}>
              <p><strong>Created:</strong> {new Date(projectData.created).toLocaleDateString()}</p>
              {projectData.updated && (
                <p><strong>Last Updated:</strong> {new Date(projectData.updated).toLocaleDateString()}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={'content-block dx-card responsive-paddings'}>
        <div className="form-actions">
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
        <Form
          ref={(ref) => setFormRef(ref)}
          formData={projectData}
          labelLocation={'top'}
          items={formItems}
        />
      </div>
    </React.Fragment>
  );
}
