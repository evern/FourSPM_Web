import React from 'react';
import { ProjectInfo } from '../../types/project';
import './styles.css';

interface ProjectHeaderProps {
  project: ProjectInfo | null;
  currentPeriod: number;
}

/**
 * Reusable component for displaying project header information
 * including the project number, name, and current reporting period
 */
const ProjectHeader: React.FC<ProjectHeaderProps> = ({ project, currentPeriod }) => {
  return (
    <>
      <div className="period-selector">
        <div className="period-info">
          <span>Reporting Period: </span>
          <strong>{currentPeriod}</strong>
        </div>
        <div className="period-date">
          <span>As of: </span>
          <strong>{new Date().toLocaleDateString()}</strong>
        </div>
      </div>
      
      {project && (
        <div className="project-info">
          <h2>
            {project.projectNumber} - {project.name}
          </h2>
        </div>
      )}
    </>
  );
};

export default ProjectHeader;
