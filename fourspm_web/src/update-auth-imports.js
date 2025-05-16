/**
 * Script to update auth context imports across the project
 * This simplifies the migration from contexts/auth to auth/AuthContext
 */
const fs = require('fs');
const path = require('path');

// Paths to be updated
const filesToUpdate = [
  // Components
  'src/components/login-form/login-form.tsx',
  'src/components/user-panel/user-panel.tsx',
  'src/components/ODataGrid/ODataGrid.tsx',
  
  // Pages
  'src/pages/areas/areas.tsx',
  'src/pages/variations/variations.tsx',
  'src/pages/projects/projects.tsx',
  'src/pages/disciplines/disciplines.tsx',
  'src/pages/document-types/document-types.tsx',
  'src/pages/deliverable-progress/deliverable-progress.tsx',
  'src/pages/deliverable-gates/deliverable-gates.tsx',
  'src/pages/clients/clients.tsx',
  'src/pages/auth-test/auth-test.tsx',
  
  // Contexts
  'src/contexts/areas/areas-context.tsx',
  
  // Hooks
  'src/hooks/utils/useAutoIncrement.ts',
  
  // Stores
  'src/stores/odataStores.ts',
];

// Project root
const projectRoot = path.resolve(__dirname, '..');

// Process each file
const updateImports = () => {
  filesToUpdate.forEach(relativePath => {
    const filePath = path.join(projectRoot, relativePath);
    
    if (!fs.existsSync(filePath)) {
      console.warn(`File not found: ${filePath}`);
      return;
    }
    
    try {
      // Read file content
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Replace imports
      const updatedContent = content
        .replace("from '../../contexts/auth'", "from '../../auth'")
        .replace("from '../contexts/auth'", "from '../auth'")
        .replace("from './contexts/auth'", "from './auth'");
      
      // Only write if changes were made
      if (content !== updatedContent) {
        fs.writeFileSync(filePath, updatedContent);
        console.log(`Updated imports in: ${relativePath}`);
      } else {
        console.log(`No changes needed in: ${relativePath}`);
      }
    } catch (error) {
      console.error(`Error processing ${relativePath}:`, error);
    }
  });
  
  console.log('\nImport update complete!');
};

// Run the update function
updateImports();
