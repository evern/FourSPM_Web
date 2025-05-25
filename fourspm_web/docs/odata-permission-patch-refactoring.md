# Refactoring Permission Management to Use OData PATCH Operations

## Current Implementation

The current implementation uses a dedicated endpoint (`SetPermissionLevel`) to update permission levels. This approach works but introduces several challenges:

1. It requires maintaining a separate API endpoint and handler
2. It doesn't leverage the OData protocol's built-in CRUD operations
3. It forces us to implement custom refresh logic for the grid
4. It introduces potential race conditions between permission updates and grid data

## Proposed Refactoring

We can refactor the permission management system to use ODataGrid's PATCH operations directly. This would simplify the code, improve reliability, and follow DevExtreme best practices.

### Backend Changes

#### 1. Expose PATCH Endpoint in RolePermissionsController

```csharp
[HttpPatch("GetPermissionSummary(roleId={roleId})/featureKey={featureKey}")]
public async Task<IActionResult> UpdatePermissionLevel(
    [FromODataUri] Guid roleId,
    [FromODataUri] string featureKey,
    [FromBody] Delta<RolePermissionSummaryEntity> patch)
{
    try
    {
        // Validate parameters
        if (roleId == Guid.Empty || string.IsNullOrEmpty(featureKey))
        {
            return BadRequest("Invalid roleId or featureKey");
        }

        // Get the current permission summary to determine permission type
        var existingPermissions = await _repository.GetRolePermissionSummaryAsync(roleId);
        var targetPermission = existingPermissions.FirstOrDefault(p => p.FeatureKey == featureKey);
        
        if (targetPermission == null)
        {
            return NotFound($"Permission with featureKey {featureKey} not found");
        }

        // Apply the patch to get the new values
        var patchedEntity = new RolePermissionSummaryEntity();
        patch.Patch(patchedEntity);

        // Check which properties were modified
        if (patch.GetChangedPropertyNames().Contains("permissionLevel"))
        {
            // Handle Access Level permissions
            if (targetPermission.PermissionType == PermissionConstants.TypeAccessLevel)
            {
                // Convert numerical level to action
                string action;
                switch (patchedEntity.PermissionLevel)
                {
                    case 0:
                        action = "NoAccess";
                        break;
                    case 1:
                        action = "ReadOnly";
                        break;
                    case 2:
                        action = "FullAccess";
                        break;
                    default:
                        return BadRequest($"Invalid permission level: {patchedEntity.PermissionLevel}");
                }

                // Use existing logic to update permissions
                await UpdateAccessLevelPermission(roleId, featureKey, action);
            }
            // Handle Toggle permissions
            else if (targetPermission.PermissionType == PermissionConstants.TypeToggle)
            {
                // Convert numerical level to action
                string action = patchedEntity.PermissionLevel > 0 ? "Enable" : "Disable";
                
                // Use existing logic to update permissions
                await UpdateTogglePermission(roleId, featureKey, action);
            }
        }

        // Get the updated permissions and return the specific one that was changed
        var updatedPermissions = await _repository.GetRolePermissionSummaryAsync(roleId);
        var updatedPermission = updatedPermissions.FirstOrDefault(p => p.FeatureKey == featureKey);

        if (updatedPermission == null)
        {
            return NotFound($"Updated permission with featureKey {featureKey} not found");
        }

        return Ok(updatedPermission);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, $"Error updating permission level for role {roleId}, feature {featureKey}");
        return StatusCode(500, "Internal Server Error - " + ex.Message);
    }
}

// Helper methods to reuse existing permission update logic
private async Task UpdateAccessLevelPermission(Guid roleId, string featureKey, string action)
{
    switch (action)
    {
        case "NoAccess":
            // Remove both view and edit permissions if they exist
            await _repository.RemovePermissionFromRoleAsync(roleId, $"{featureKey}.view");
            await _repository.RemovePermissionFromRoleAsync(roleId, $"{featureKey}.edit");
            break;
            
        case "ReadOnly":
            // Remove edit permission if it exists
            await _repository.RemovePermissionFromRoleAsync(roleId, $"{featureKey}.edit");
            
            // Add view permission if it doesn't exist
            if (!await _repository.HasPermissionAsync(roleId, $"{featureKey}.view"))
            {
                await _repository.AddPermissionToRoleAsync(roleId, $"{featureKey}.view");
            }
            break;
            
        case "FullAccess":
            // Remove view permission if it exists (since edit implies view)
            await _repository.RemovePermissionFromRoleAsync(roleId, $"{featureKey}.view");
            
            // Add edit permission if it doesn't exist
            if (!await _repository.HasPermissionAsync(roleId, $"{featureKey}.edit"))
            {
                await _repository.AddPermissionToRoleAsync(roleId, $"{featureKey}.edit");
            }
            break;
            
        default:
            throw new ArgumentException($"Invalid action: {action}");
    }
}

private async Task UpdateTogglePermission(Guid roleId, string featureKey, string action)
{
    switch (action)
    {
        case "Enable":
            // Add the toggle permission if it doesn't exist
            if (!await _repository.HasPermissionAsync(roleId, featureKey))
            {
                await _repository.AddPermissionToRoleAsync(roleId, featureKey);
            }
            break;
            
        case "Disable":
            // Remove the toggle permission if it exists
            await _repository.RemovePermissionFromRoleAsync(roleId, featureKey);
            break;
            
        default:
            throw new ArgumentException($"Invalid action: {action}");
    }
}
```

### Frontend Changes

#### 1. Update Permission Columns to Use PATCH

```typescript
// In permission-columns.ts

type PermissionColumnsConfig = {
  odataStore: any; // DevExtreme ODataStore
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
};

export const permissionColumns = (config: PermissionColumnsConfig): ODataGridColumn[] => {
  // Existing column definitions...

  // Button click handlers for permission levels
  const handleNoAccess = async (e: any) => {
    if (e.row?.data) {
      const { featureKey, displayName } = e.row.data;
      try {
        // Use direct PATCH operation with OData store
        await config.odataStore.update(featureKey, { permissionLevel: 0 });
        config.showSuccess(`Permission for ${displayName} set to No Access`);
        // Grid will automatically refresh after successful update
      } catch (error: any) {
        config.showError(`Failed to update permission: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const handleReadOnly = async (e: any) => {
    if (e.row?.data) {
      const { featureKey, displayName } = e.row.data;
      try {
        // Use direct PATCH operation with OData store
        await config.odataStore.update(featureKey, { permissionLevel: 1 });
        config.showSuccess(`Permission for ${displayName} set to Read-Only`);
        // Grid will automatically refresh after successful update
      } catch (error: any) {
        config.showError(`Failed to update permission: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const handleFullAccess = async (e: any) => {
    if (e.row?.data) {
      const { featureKey, displayName } = e.row.data;
      try {
        // Use direct PATCH operation with OData store
        await config.odataStore.update(featureKey, { permissionLevel: 2 });
        config.showSuccess(`Permission for ${displayName} set to Full Access`);
        // Grid will automatically refresh after successful update
      } catch (error: any) {
        config.showError(`Failed to update permission: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const handleToggleEnable = async (e: any) => {
    if (e.row?.data) {
      const { featureKey, displayName } = e.row.data;
      try {
        // Use direct PATCH operation with OData store
        await config.odataStore.update(featureKey, { permissionLevel: 1 });
        config.showSuccess(`${displayName} enabled`);
        // Grid will automatically refresh after successful update
      } catch (error: any) {
        config.showError(`Failed to enable ${displayName}: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const handleToggleDisable = async (e: any) => {
    if (e.row?.data) {
      const { featureKey, displayName } = e.row.data;
      try {
        // Use direct PATCH operation with OData store
        await config.odataStore.update(featureKey, { permissionLevel: 0 });
        config.showSuccess(`${displayName} disabled`);
        // Grid will automatically refresh after successful update
      } catch (error: any) {
        config.showError(`Failed to disable ${displayName}: ${error.message || 'Unknown error'}`);
      }
    }
  };

  // Update the buttons to use the new handlers
  const columns: any[] = [
    // Existing columns...
    {
      type: 'buttons',
      width: 110,
      alignment: 'center',
      buttons: [
        // No Access button
        {
          name: 'setNoAccess',
          hint: 'Set to No Access',
          icon: 'clear',
          visible: (e: any) => {
            if (!e || !e.row || !e.row.data) return false;
            const permissionType = e.row.data?.permissionType || PermissionType.AccessLevel;
            return permissionType === PermissionType.AccessLevel;
          },
          onClick: handleNoAccess
        },
        // Read-Only button
        {
          name: 'setReadOnly',
          hint: 'Set to Read-Only',
          icon: 'find',
          visible: (e: any) => {
            if (!e || !e.row || !e.row.data) return false;
            const permissionType = e.row.data?.permissionType || PermissionType.AccessLevel;
            return permissionType === PermissionType.AccessLevel;
          },
          onClick: handleReadOnly
        },
        // Full Access button
        {
          name: 'setFullAccess',
          hint: 'Set to Full Access',
          icon: 'edit',
          visible: (e: any) => {
            if (!e || !e.row || !e.row.data) return false;
            const permissionType = e.row.data?.permissionType || PermissionType.AccessLevel;
            return permissionType === PermissionType.AccessLevel;
          },
          onClick: handleFullAccess
        },
        // Toggle Disable button
        {
          name: 'toggleDisable',
          hint: 'Disable',
          icon: 'minus',
          visible: (e: any) => {
            if (!e || !e.row || !e.row.data) return false;
            const permissionType = e.row.data?.permissionType || PermissionType.AccessLevel;
            return permissionType === PermissionType.Toggle;
          },
          onClick: handleToggleDisable
        },
        // Toggle Enable button
        {
          name: 'toggleEnable',
          hint: 'Enable',
          icon: 'add',
          visible: (e: any) => {
            if (!e || !e.row || !e.row.data) return false;
            const permissionType = e.row.data?.permissionType || PermissionType.AccessLevel;
            return permissionType === PermissionType.Toggle;
          },
          onClick: handleToggleEnable
        }
      ]
    }
  ];

  return columns as ODataGridColumn[];
};
```

#### 2. Update Role Permissions Component to Provide ODataStore

```tsx
// In role-permissions.tsx

const RolePermissionsContent = React.memo((): React.ReactElement => {
  const { roleId } = useParams<RolePermissionParams>();
  const { state: { loading, error, role } } = usePermissions();

  // Create the OData store for permission operations
  const store = useMemo(() => {
    if (!role?.guid) return null;
    
    return new ODataStore({
      url: `${ROLE_PERMISSIONS_ENDPOINT}/GetPermissionSummary(roleId=${role.guid})`,
      key: 'featureKey',
      keyType: 'String',
      version: 4
    });
  }, [role?.guid]);

  // Notification functions
  const showSuccess = useCallback((message: string) => {
    notify({
      message,
      type: 'success',
      displayTime: 3000,
      position: { at: 'bottom center', my: 'bottom center' }
    });
  }, []);

  const showError = useCallback((message: string) => {
    notify({
      message,
      type: 'error',
      displayTime: 5000,
      position: { at: 'bottom center', my: 'bottom center' }
    });
  }, []);

  // Configure columns with the OData store
  const columns = useMemo(() => {
    if (!store) return [];
    
    return permissionColumns({
      odataStore: store,
      showSuccess,
      showError
    });
  }, [store, showSuccess, showError]);

  // Grid handlers for standard operations
  const handleRowUpdating = useCallback((e: any) => {
    // Cancel default update behavior - we handle updates through our buttons
    e.cancel = true;
  }, []);

  const handleRowInserting = useCallback((e: any) => {
    // Cancel default insert behavior - not applicable for permissions
    e.cancel = true;
  }, []);

  const handleRowRemoving = useCallback((e: any) => {
    // Cancel default delete behavior - not applicable for permissions
    e.cancel = true;
  }, []);

  const handleEditorPreparing = useCallback((e: any) => {
    // Disable standard editors - we use buttons instead
    e.editorOptions.readOnly = true;
  }, []);

  return (
    <div className="role-permissions-container">
      {/* Loading indicator */}
      <LoadPanel
        position={{ of: '.app-main-content' }}
        visible={loading}
        showIndicator={true}
        shading={true}
        shadingColor="rgba(0,0,0,0.1)"
        showPane={true}
      />
      
      {/* Error message */}
      {error && (
        <ErrorMessage
          title="Error Loading Role Permissions"
          message={error}
        />
      )}
      
      <div className="custom-grid-wrapper">
        <div className="grid-custom-title">
          {role ? `Permissions for ${role.displayName}` : 'Role Permissions'}
        </div>
        {!loading && !error && store && (
          <ODataGrid
            title=" "
            // Use the dataSource with our store instead of endpoint
            dataSource={{
              store: store,
              select: [
                'featureKey',
                'displayName',
                'description',
                'featureGroup',
                'permissionLevel',
                'permissionLevelText',
                'permissionType',
                'viewPermissionGuid',
                'editPermissionGuid',
                'togglePermissionGuid'
              ]
            }}
            columns={columns}
            keyField="featureKey"
            customGridHeight={900}
            
            // Disable standard editing operations since we use custom buttons
            allowAdding={false}
            allowDeleting={false}
            allowUpdating={false}
            
            // Sorting and filtering
            defaultSort={[{ selector: 'featureGroup', desc: false }]}
            
            // Enable grouping by feature group
            allowGrouping={true}
            showGroupPanel={false}
            autoExpandAll={true}
            
            // Event handlers
            onEditorPreparing={handleEditorPreparing}
            onRowUpdating={handleRowUpdating}
            onRowInserting={handleRowInserting}
            onRowRemoving={handleRowRemoving}
          />
        )}
      </div>
      
      <ScrollToTop />
    </div>
  );
});
```

## Benefits of This Approach

1. **Simplicity**: Uses standard OData PATCH operations instead of custom endpoints
2. **Consistency**: Follows DevExtreme's recommended patterns for grid data operations
3. **Performance**: Leverages ODataGrid's built-in optimizations for data updates
4. **Maintainability**: Reduces custom code and aligns with the Collection View Doctrine
5. **UI Responsiveness**: Automatic grid refresh after operations without manual intervention

## Implementation Steps

1. Create the new PATCH endpoint in RolePermissionsController
2. Update the OData EDM model to include the permission summary entity type
3. Refactor the permission-columns.ts to use direct store operations
4. Update role-permissions.tsx to create and provide the ODataStore
5. Remove the existing setPermissionLevel action adapter and related code
6. Test each permission operation to ensure correct behavior

## Notes on OData Configuration

For this approach to work correctly, the OData endpoint must be properly configured to handle PATCH operations. This includes:

1. Ensuring the entity set supports updates
2. Configuring proper routing for PATCH operations
3. Setting up proper model binding for Delta<T> parameters

These are already standard practices in the FourSPM application, but should be verified during implementation.
