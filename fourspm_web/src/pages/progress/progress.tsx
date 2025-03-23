import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/auth';
import './progress.scss';

// Import custom hooks from shared location
import { useProjectInfo } from '../../hooks/useProjectInfo';
import { useDeliverableGates } from '../../hooks/useDeliverableGates';
import { useProgressHandlers } from '../../hooks/useProgressHandlers';

// Import components from shared location
import { ODataGrid } from '../../components/ODataGrid/ODataGrid';
import LoadPanel from 'devextreme-react/load-panel';
import Button from 'devextreme-react/button';
import NumberBox from 'devextreme-react/number-box';
import ScrollView from 'devextreme-react/scroll-view';

// Import types from shared location
import { API_CONFIG } from '../../config/api';
import { createProgressColumns } from './progress-columns';

// URL params
interface ProgressParams {
  projectId: string;
}

const Progress: React.FC = () => {
  // Extract project ID from URL params
  const { projectId } = useParams<ProgressParams>();
  const { user } = useAuth();
  
  // Ref for the container element
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Fetch project information
  const { 
    project, 
    currentPeriod: initialPeriod, 
    isLoading: isLoadingProject 
  } = useProjectInfo(projectId, user?.token);
  
  // State for user-selected period and calculated progress date
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);
  const [progressDate, setProgressDate] = useState<Date>(new Date());
  
  // State for scroll to top button visibility
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);
  
  // Initialize selectedPeriod once initialPeriod is available
  useEffect(() => {
    if (initialPeriod !== null && selectedPeriod === null) {
      setSelectedPeriod(initialPeriod);
    }
  }, [initialPeriod, selectedPeriod]);
  
  // Calculate progress date whenever period or project start date changes
  useEffect(() => {
    if (project?.progressStart && selectedPeriod !== null) {
      const startDate = new Date(project.progressStart);
      const newProgressDate = new Date(startDate);
      newProgressDate.setDate(startDate.getDate() + (selectedPeriod * 7)); // Add weeks
      setProgressDate(newProgressDate);
    }
  }, [selectedPeriod, project?.progressStart]);
  
  // Handle scroll events to show/hide scroll-to-top button
  useEffect(() => {
    // Check scroll position directly on mount
    const checkScrollPosition = () => {
      // First try to detect window scroll
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      if (scrollY > 300) {
        setShowScrollTop(true);
        return;
      }
      
      // Then check if we have a container element that's scrollable
      const container = containerRef.current;
      if (container && container.scrollTop > 300) {
        setShowScrollTop(true);
        return;
      }
      
      // If neither is scrolled, hide the button
      setShowScrollTop(false);
    };
    
    // Run initial check
    checkScrollPosition();
    
    // Handle window scroll
    const handleWindowScroll = () => {
      checkScrollPosition();
    };
    
    // Handle container scroll
    const handleContainerScroll = (e: Event) => {
      if (e.target instanceof Element && e.target.scrollTop > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    
    // Add scroll event listeners
    window.addEventListener('scroll', handleWindowScroll);
    
    // Find potential scroll containers
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleContainerScroll);
    }
    
    // Find DevExtreme scroll containers
    const scrollContainers = document.querySelectorAll('.dx-scrollable-container');
    scrollContainers.forEach(container => {
      container.addEventListener('scroll', handleContainerScroll);
    });
    
    // Clean up event listeners
    return () => {
      window.removeEventListener('scroll', handleWindowScroll);
      
      if (container) {
        container.removeEventListener('scroll', handleContainerScroll);
      }
      
      scrollContainers.forEach(container => {
        container.removeEventListener('scroll', handleContainerScroll);
      });
    };
  }, []);
  
  // Scroll to top function
  const scrollToTop = () => {
    // Try scrolling the window first
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    
    // Also try scrolling the container if present
    const container = containerRef.current;
    if (container) {
      container.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
    
    // Also try scrolling DevExtreme scrollable containers
    const scrollContainers = document.querySelectorAll('.dx-scrollable-container');
    scrollContainers.forEach(container => {
      if (container instanceof HTMLElement) {
        container.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
    });
  };
  
  // Fetch deliverable gates
  const { 
    deliverableGates,
    isLoadingGates
  } = useDeliverableGates(user?.token);

  // Set up row updating and validation handlers
  const { 
    handleRowUpdating, 
    handleRowValidating,
    handleSaving
  } = useProgressHandlers(deliverableGates, selectedPeriod ?? initialPeriod ?? 0, user?.token);
  
  // Debug logs to help troubleshoot API issues
  console.log('Progress Component - Initial Render:', {
    projectId,
    hasToken: !!user?.token,
    isLoadingGates
  });

  // Handle period increment/decrement
  const handlePeriodChange = (increment: boolean) => {
    if (selectedPeriod !== null) {
      setSelectedPeriod(prevPeriod => (prevPeriod !== null ? prevPeriod + (increment ? 1 : -1) : null));
    }
  };

  // Check if any data is still loading
  const isLoading = isLoadingProject || isLoadingGates;

  return (
    <div className="progress-container" ref={containerRef}>
      {/* Show loading indicator when data is being fetched */}
      <LoadPanel 
        visible={isLoading} 
        position={{ of: '.progress-container' }}
        showIndicator={true}
        showPane={true}
      />
      
      {/* Only render grid when data is loaded */}
      {!isLoading && (
        <div className="custom-grid-wrapper">
          <div className="grid-custom-title">
            {project ? `${project.projectNumber} - ${project.name} Progress Tracking` : 'Progress Tracking'}
          </div>
          {/* Project header with period info */}
          {project && (
            <div className="period-selector">
              <div className="period-details">
                <div className="period-info">
                  <div className="info-item">
                    <span>Reporting Period:</span>
                    <div className="number-box-container">
                      <NumberBox
                        value={selectedPeriod || 0}
                        min={0}
                        showSpinButtons={true}
                        useLargeSpinButtons={true}
                        onValueChanged={(e) => {
                          if (e.value !== null && e.value !== undefined) {
                            const currentPeriod = selectedPeriod || 0;
                            const isIncrement = e.value > currentPeriod;
                            handlePeriodChange(isIncrement);
                          }
                        }}
                        className="period-number-box"
                        width={100}
                        stylingMode="filled"
                      />
                    </div>
                    <span className="secondary-info">(weeks from project start)</span>
                  </div>
                  <div className="info-item">
                    <span>Progress Date:</span>
                    <strong>{progressDate.toLocaleDateString()}</strong>
                  </div>
                  <div className="info-item">
                    <span>Project Start Date:</span>
                    <strong>
                      {project.progressStart
                        ? new Date(project.progressStart).toLocaleDateString()
                        : 'Not set'}
                    </strong>
                    {project.progressStart && (
                      <span className="secondary-info">({new Date(project.progressStart).toLocaleString('en-US', {weekday: 'long'})})</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Progress tracking grid - using the ODataGrid component */}
          <ODataGrid
            title=" "
            endpoint={`${API_CONFIG.baseUrl}/odata/v1/Deliverables/GetWithProgressPercentages?projectGuid=${projectId}&period=${selectedPeriod ?? initialPeriod ?? 0}`}
            columns={createProgressColumns()}
            keyField="guid"
            onRowUpdating={handleRowUpdating}
            onRowValidating={handleRowValidating}
            onSaving={handleSaving}
            allowUpdating={true}
            allowAdding={false}
            allowDeleting={false}
          />
        </div>
      )}
      
      {/* Floating scroll-to-top button */}
      {showScrollTop && (
        <Button
          className="scroll-top-button"
          icon="chevronup"
          onClick={scrollToTop}
          stylingMode="outlined"
        />
      )}
    </div>
  );
};

export default Progress;
