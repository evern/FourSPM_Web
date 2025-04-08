import React from 'react';
import { DeliverableEditorProvider } from './deliverable-editor-context';

/**
 * Combines all editor-related context providers in the correct order
 * Makes it easier to include all editor contexts in the app hierarchy
 */
export function EditorProviders({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <DeliverableEditorProvider>
      {children}
    </DeliverableEditorProvider>
  );
}
