import { useState, useCallback } from 'react';
import { ProjectDetails } from '../types/project';
import { updateProject } from '../services/project.service';
import notify from 'devextreme/ui/notify';
import Form from 'devextreme-react/form';

/**
 * Hook to manage project editing state and operations
 * @param projectId The project GUID to edit
 * @param userToken The user's authentication token
 * @returns Object containing editing state and handler functions
 */
export const useProjectEdit = (projectId: string | undefined, userToken: string | undefined) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [formRef, setFormRef] = useState<Form | null>(null);

  /**
   * Save project changes
   * @param currentData Current project data object
   * @returns Updated project data if successful, null otherwise
   */
  const saveProjectChanges = useCallback(async (currentData: ProjectDetails): Promise<ProjectDetails | null> => {
    if (!formRef || !projectId || !userToken) return null;

    setIsSaving(true);
    try {
      const formData = formRef.instance.option('formData');
      const result = await updateProject(projectId, formData, userToken);
      
      if (result) {
        notify('Project updated successfully', 'success', 3000);
        setIsEditing(false);
        return result;
      }
      return null;
    } catch (error) {
      console.error('Error updating project:', error);
      notify('Error updating project', 'error', 3000);
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [formRef, projectId, userToken]);

  /**
   * Set the form reference for accessing form data
   */
  const onFormRef = useCallback((ref: Form) => {
    setFormRef(ref);
  }, []);

  /**
   * Start editing mode
   */
  const startEdit = useCallback(() => {
    setIsEditing(true);
  }, []);

  /**
   * Cancel editing mode
   */
  const cancelEdit = useCallback(() => {
    setIsEditing(false);
  }, []);

  return {
    isEditing,
    isSaving,
    formRef,
    onFormRef,
    startEdit,
    cancelEdit,
    saveProjectChanges
  };
};
