import React, { useState, useEffect } from 'react';
import Button from 'devextreme-react/button';
import './scroll-to-top.scss';

interface ScrollToTopProps {
  showAfterScrollHeight?: number; // Height after which the button appears (in px)
}

const ScrollToTop: React.FC<ScrollToTopProps> = ({ 
  showAfterScrollHeight = 300 // Default value
}) => {
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);
  
  // Handle scroll events to show/hide scroll-to-top button
  useEffect(() => {
    // Check scroll position directly on mount and whenever scroll happens
    const checkScrollPosition = () => {
      // First try to detect window scroll
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      if (scrollY > showAfterScrollHeight) {
        setShowScrollTop(true);
        return;
      }
      
      // Then check for scrollable containers (like DevExtreme components)
      const scrollContainers = document.querySelectorAll('.dx-scrollable-container');
      let foundScroll = false;
      
      scrollContainers.forEach(container => {
        if (container instanceof HTMLElement && container.scrollTop > showAfterScrollHeight) {
          setShowScrollTop(true);
          foundScroll = true;
          return;
        }
      });
      
      // If neither is scrolled enough, hide the button
      if (!foundScroll) {
        setShowScrollTop(false);
      }
    };
    
    // Run initial check
    checkScrollPosition();
    
    // Handle window scroll
    const handleScroll = () => {
      checkScrollPosition();
    };
    
    // Add scroll event listeners
    window.addEventListener('scroll', handleScroll);
    
    // Find DevExtreme scroll containers and add listeners
    const scrollContainers = document.querySelectorAll('.dx-scrollable-container');
    scrollContainers.forEach(container => {
      container.addEventListener('scroll', handleScroll);
    });
    
    // Clean up event listeners
    return () => {
      window.removeEventListener('scroll', handleScroll);
      
      scrollContainers.forEach(container => {
        container.removeEventListener('scroll', handleScroll);
      });
    };
  }, [showAfterScrollHeight]);
  
  // Scroll to top function that handles both window and container scrolling
  const scrollToTop = () => {
    // Try scrolling the window first
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    
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
  
  return (
    <>
      {showScrollTop && (
        <Button
          className="scroll-top-button"
          icon="chevronup"
          onClick={scrollToTop}
          stylingMode="outlined"
          aria-label="Scroll to top"
        />
      )}
    </>
  );
};

export default ScrollToTop;
