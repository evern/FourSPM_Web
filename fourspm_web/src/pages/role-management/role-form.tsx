import React, { useCallback, useEffect } from 'react';
import { Form, SimpleItem, GroupItem, RequiredRule, StringLengthRule, ButtonItem } from 'devextreme-react/form';
import { Role, RoleCreateParams, RoleUpdateParams } from '../../types/role-types';
import { CheckBox } from 'devextreme-react/check-box';
import TextArea from 'devextreme-react/text-area';
import './role-form.scss';

interface RoleFormProps {
  role?: Role | null;
  onSave: (formData: RoleCreateParams | RoleUpdateParams) => void;
  onCancel: () => void;
}

/**
 * Role form component for creating and editing roles
 */
const RoleForm: React.FC<RoleFormProps> = ({ role, onSave, onCancel }) => {
  // Create default form data
  const defaultFormData = React.useMemo(() => {
    return {
      name: role?.name || '',
      description: role?.description || '',
      permissions: role?.permissions || []
    };
  }, [role]);

  const [formData, setFormData] = React.useState<RoleCreateParams | RoleUpdateParams>(defaultFormData);
  const formRef = React.useRef<any>(null);

  // Reset form data when role changes
  useEffect(() => {
    setFormData(defaultFormData);
  }, [defaultFormData]);

  // Handle form field change
  const handleFieldChange = useCallback((e: any) => {
    const { dataField, value } = e;
    setFormData((prev) => ({
      ...prev,
      [dataField]: value
    }));
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(() => {
    const validationResult = formRef.current?.instance.validate();
    if (validationResult?.isValid) {
      onSave(formData);
    }
  }, [formData, onSave]);

  // Render the text area for description
  const descriptionRender = useCallback(() => {
    return (
      <TextArea
        value={formData.description}
        onValueChanged={(e) => handleFieldChange({ dataField: 'description', value: e.value })}
        minHeight={100}
        maxHeight={150}
        placeholder="Enter role description"
      />
    );
  }, [formData.description, handleFieldChange]);

  // Custom permission selection renderer (placeholder for future permission tree component)
  const permissionsRender = useCallback(() => {
    return (
      <div className="permissions-placeholder">
        <p>Permission selection will be implemented in the Permission Management task.</p>
        <p>Currently, roles are created with empty permissions.</p>
      </div>
    );
  }, []);

  return (
    <div className="role-form">
      <Form
        ref={formRef}
        formData={formData}
        labelMode="floating"
        showColonAfterLabel={false}
        showValidationSummary={true}
        onFieldDataChanged={handleFieldChange}
      >
        <GroupItem>
          <SimpleItem
            dataField="name"
            label={{ text: 'Role Name' }}
            editorOptions={{
              placeholder: 'Enter role name',
              disabled: role?.isSystemRole
            }}
          >
            <RequiredRule message="Role name is required" />
            <StringLengthRule min={3} max={50} message="Role name must be between 3 and 50 characters" />
          </SimpleItem>

          <SimpleItem
            dataField="description"
            label={{ text: 'Description' }}
            editorType="dxTextArea"
            editorOptions={{
              placeholder: 'Enter role description',
              disabled: role?.isSystemRole
            }}
            render={descriptionRender}
          />

          <SimpleItem
            dataField="permissions"
            label={{ text: 'Permissions' }}
            render={permissionsRender}
          />

          {role && (
            <SimpleItem
              dataField="isSystemRole"
              label={{ text: 'System Role' }}
              editorType="dxCheckBox"
              editorOptions={{
                readOnly: true,
                text: 'This is a system-defined role',
                value: role.isSystemRole
              }}
            />
          )}
        </GroupItem>

        <GroupItem cssClass="form-buttons">
          <ButtonItem
            buttonOptions={{
              text: role ? 'Update Role' : 'Create Role',
              type: 'default',
              useSubmitBehavior: false,
              onClick: handleSubmit,
              disabled: role?.isSystemRole
            }}
          />
          <ButtonItem
            buttonOptions={{
              text: 'Cancel',
              type: 'normal',
              onClick: onCancel
            }}
          />
        </GroupItem>
      </Form>
    </div>
  );
};

export default RoleForm;
