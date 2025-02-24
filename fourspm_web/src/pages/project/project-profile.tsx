import React, { useState, useEffect } from 'react';
import './project-profile.scss';
import Form, { SimpleItem, GroupItem } from 'devextreme-react/form';
import { useParams } from 'react-router-dom';
import { getProjectDetails, ProjectDetails } from '../../services/project-service';
import { useAuth } from '../../contexts/auth';
import { dxFormGroupItem } from 'devextreme/ui/form';

export default function ProjectProfile() {
  const { projectId } = useParams<{ projectId: string }>();
  const [projectData, setProjectData] = useState<ProjectDetails | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchProjectData = async () => {
      if (user?.token && projectId) {
        try {
          const data = await getProjectDetails(projectId, user.token);
          setProjectData(data);
        } catch (error) {
          console.error('Error fetching project data:', error);
        }
      }
    };
    fetchProjectData();
  }, [projectId, user?.token]);

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
        editorOptions: { readOnly: true }
      },
      {
        itemType: 'simple',
        dataField: 'projectStatus',
        editorOptions: { readOnly: true }
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
        editorOptions: { readOnly: true }
      },
      {
        itemType: 'simple',
        dataField: 'clientContact',
        editorOptions: { readOnly: true }
      },
      {
        itemType: 'simple',
        dataField: 'purchaseOrderNumber',
        editorOptions: { readOnly: true }
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
        <Form
          formData={projectData}
          labelLocation={'top'}
          colCount={2}
          items={formItems}
        />
      </div>
    </React.Fragment>
  );
}
