import React, { useState, useEffect, useRef, useContext } from 'react';
import './project-profile.scss';
import Form from 'devextreme-react/form';
import type { IGroupItemProps } from 'devextreme-react/form';
import { useParams } from 'react-router-dom';
import { getProjectDetails, ProjectDetails, updateProject } from '../../services/project-service';
import { useAuth } from '../../contexts/auth';
import { Button } from 'devextreme-react/button';
import notify from 'devextreme/ui/notify';
import { projectStatuses } from '../projects/project-statuses';
import { useScreenSize } from '../../utils/media-query';
import { ScrollView } from 'devextreme-react/scroll-view';
import ODataStore from 'devextreme/data/odata/store';
import { API_CONFIG } from '../../config/api';
import { LoadPanel } from 'devextreme-react/load-panel';
import { LoadIndicator } from 'devextreme-react/load-indicator';

// Constants
const PROGRESS_START_TOOLTIP = 'Deliverables progress period will refresh weekly on the provided day of week';

const getStatusDisplayName = (statusId: string) => {
  const status = projectStatuses.find(s => s.id === statusId);
  return status ? status.name : statusId;
};

// Create Client lookup ODataStore
const clientStore = new ODataStore({
  url: `${API_CONFIG.baseUrl}/odata/v1/Clients`,
  version: 4,
  key: 'guid',
  keyType: 'Guid',
  beforeSend: (options: any) => {
    const token = localStorage.getItem('user') ? 
      JSON.parse(localStorage.getItem('user') || '{}').token : null;
    
    if (!token) {
      console.error('No token available');
      return false;
    }

    options.headers = {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    };

    return true;
  }
});

export default function ProjectProfile() {
  const { projectId } = useParams<{ projectId: string }>();
  const [projectData, setProjectData] = useState<ProjectDetails | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formRef, setFormRef] = useState<Form | null>(null);
  const [clientDetails, setClientDetails] = useState<any>(null);
  const [selectedClientContact, setSelectedClientContact] = useState<{
    name: string | null;
    number: string | null;
    email: string | null;
  }>({ name: null, number: null, email: null });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingClient, setIsLoadingClient] = useState(false);
  const { user } = useAuth();
  const { isXSmall, isSmall } = useScreenSize();
  const scrollViewRef = useRef<ScrollView>(null);

  // Fetch client details function to reuse for initial load and selection change
  const fetchClientDetails = async (clientGuid: string, token: string) => {
    setIsLoadingClient(true);
    try {
      const response = await fetch(`${API_CONFIG.baseUrl}/odata/v1/Clients(${clientGuid})`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const clientData = await response.json();
        console.log('Retrieved client data:', clientData); // See what fields are actually available
        setClientDetails(clientData);
        
        // Use the exact field names from ClientsController.cs MapToEntity method
        const contact = {
          name: clientData.clientContactName || null,
          number: clientData.clientContactNumber || null,
          email: clientData.clientContactEmail || null
        };
        
        console.log('Extracted contact info:', contact);
        setSelectedClientContact(contact);
        return { ...clientData, contact };
      }
    } catch (error) {
      console.error('Error fetching client details:', error);
      notify('Error loading client data', 'error', 3000);
    } finally {
      setIsLoadingClient(false);
    }
    return null;
  };

  // Handle client selection change
  const handleClientChange = async (e: any) => {
    if (user?.token && e.value) {
      const clientDataResult = await fetchClientDetails(e.value, user.token);
      if (clientDataResult && formRef) {
        const clientData = clientDataResult;
        // Update form data with new client contact information
        setProjectData(prevData => {
          if (!prevData) return null;
          
          console.log('Updating project data with client contact:', clientData.contact);
          
          return {
            ...prevData,
            clientGuid: e.value,
            clientContactName: clientData.contact.name || '',
            clientContactNumber: clientData.contact.number || '',
            clientContactEmail: clientData.contact.email || ''
          };
        });
      }
    }
  };

  useEffect(() => {
    const fetchProjectData = async () => {
      if (user?.token && projectId) {
        try {
          const data = await getProjectDetails(projectId, user.token);
          setProjectData(data);

          // If clientGuid exists, fetch client details
          if (data.clientGuid) {
            await fetchClientDetails(data.clientGuid, user.token);
          }

          // Set initial contact values
          setSelectedClientContact({
            name: data.clientContactName || null,
            number: data.clientContactNumber || null,
            email: data.clientContactEmail || null
          });
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

    setIsSaving(true);
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
    } finally {
      setIsSaving(false);
    }
  };

  if (!projectData) {
    return (
      <div className="profile-loading-container">
        <LoadPanel
          visible={true}
          showIndicator={true}
          shading={true}
          showPane={true}
          shadingColor="rgba(0, 0, 0, 0.1)"
          message="Loading Project Data..."
        />
      </div>
    );
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
        editorType: isEditing ? 'dxSelectBox' : 'dxTextBox',
        editorOptions: isEditing ? { 
          items: projectStatuses,
          valueExpr: 'id',
          displayExpr: 'name'
        } : {
          readOnly: true,
          value: projectData.projectStatus ? 
                 projectStatuses.find(s => s.id === projectData.projectStatus)?.name || projectData.projectStatus : 
                 ''
        }
      },
      {
        itemType: 'simple',
        dataField: 'progressStart',
        label: { 
          text: 'Progress Start',
          hint: PROGRESS_START_TOOLTIP
        },
        editorType: isEditing ? 'dxDateBox' : 'dxTextBox',
        editorOptions: isEditing ? {
          type: 'date',
          displayFormat: 'MM/dd/yyyy'
        } : {
          readOnly: true,
          value: projectData.progressStart ? new Date(projectData.progressStart).toLocaleDateString() : ''
        }
      },
      {
        itemType: 'simple',
        dataField: 'purchaseOrderNumber',
        label: { text: 'Purchase Order #' },
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
        dataField: 'clientGuid',
        label: { text: 'Client' },
        editorType: isEditing ? 'dxSelectBox' : 'dxTextBox',
        editorOptions: isEditing ? { 
          dataSource: clientStore,
          valueExpr: 'guid',
          displayExpr: (item: any) => item ? `${item.number} - ${item.description}` : '',
          onValueChanged: handleClientChange
        } : {
          readOnly: true,
          value: isLoadingClient ? 'Loading client details...' :
                 (clientDetails ? 
                 `${clientDetails.number} - ${clientDetails.description}` : 
                 (projectData.clientGuid || 'No client selected'))
        }
      },
      isLoadingClient && {
        itemType: 'simple',
        template: () => (
          <div className="loading-indicator-container">
            <LoadIndicator width="24" height="24" visible={true} />
          </div>
        )
      },
      {
        itemType: 'simple',
        label: { text: 'Client Contact' },
        editorOptions: { 
          readOnly: true,
          value: isLoadingClient ? 'Loading...' :
                 (isEditing ? selectedClientContact.name || 'No contact information' : 
                           projectData.clientContactName || 'No contact information')
        },
        editorType: 'dxTextBox'
      },
      {
        itemType: 'simple',
        label: { text: 'Contact Number' },
        editorOptions: { 
          readOnly: true,
          value: isLoadingClient ? 'Loading...' :
                 (isEditing ? selectedClientContact.number || 'No contact information' : 
                           projectData.clientContactNumber || 'No contact information')
        },
        editorType: 'dxTextBox'
      },
      {
        itemType: 'simple',
        label: { text: 'Contact Email' },
        editorOptions: { 
          readOnly: true,
          value: isLoadingClient ? 'Loading...' :
                 (isEditing ? selectedClientContact.email || 'No contact information' : 
                           projectData.clientContactEmail || 'No contact information')
        },
        editorType: 'dxTextBox'
      }
    ]
  }];

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    // Reset the form data to the original project data
    if (formRef) {
      formRef.instance.option('formData', projectData);
    }
  };

  const onFormRef = (ref: Form) => {
    setFormRef(ref);
  };

  return (
    <div className="profile-container">
      <div className="custom-grid-wrapper">
        <div className="grid-custom-title">Project Details: {projectData.projectNumber} - {projectData.name}</div>
        <div className="grid-header-container">
          <div className="profile-status">
            Status: <span className="status-value">{getStatusDisplayName(projectData.projectStatus)}</span>
          </div>
          <div className="action-buttons">
            {!isEditing ? (
              <Button
                text="Edit"
                type="default"
                stylingMode="contained"
                onClick={handleEditClick}
              />
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <div className="save-button-container">
                  {isSaving && <div className="save-loading-indicator"><LoadIndicator width={24} height={24} visible={true} /></div>}
                  <Button
                    text="Save"
                    type="default"
                    stylingMode="contained"
                    onClick={handleSave}
                    disabled={isSaving}
                    className={isSaving ? 'saving-button' : ''}
                  />
                </div>
                <Button
                  text="Cancel"
                  stylingMode="outlined"
                  onClick={handleCancelClick}
                  disabled={isSaving}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <ScrollView 
        height="calc(100vh - 180px)" // Adjusted height since buttons are now at the top
        width="100%"
        direction="vertical"
        showScrollbar="always"
        scrollByContent={true}
        scrollByThumb={true}
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
  );
}
