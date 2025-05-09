import React from 'react';

// Set to true to enable Why Did You Render
const enabled = false;

if (process.env.NODE_ENV === 'development' && enabled) {
  const whyDidYouRender = require('@welldone-software/why-did-you-render');
  whyDidYouRender(React, {
    // Track all components, not just pure ones
    trackAllPureComponents: true,
    // Track all components
    // trackExtraHooks: [] // Removed react-redux reference
    trackHooks: true,
    // More verbose logging
    logOwnerReasons: true,
    logOnDifferentValues: true,
    collapseGroups: false,
    // Custom logging name to distinguish from other logs
    titleColor: 'green',
    diffNameColor: 'darkturquoise',
    // Default to 3 levels which should be enough for most cases
    hotReloadBufferMs: 500
  });
  
  // Log that wdyr is setup to confirm it's loading
  console.log('%c[wdyr]', 'color: green; font-weight: bold;', 'Why Did You Render has been initialized');
}
