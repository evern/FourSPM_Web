/**
 * Environment configuration
 * Centralizes all environment-related detection and settings
 * following the FourSPM UI Development Guidelines
 */

// Environment types
export enum Environment {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
  TEST = 'test'
}

// Configuration for detecting the current environment
const ENV_CONFIG = {
  // Domain patterns for environment detection
  domains: {
    [Environment.PRODUCTION]: ['app.4spm.org', 'fourspm.org'],
    [Environment.STAGING]: ['staging.4spm.org', 'staging-fourspm.org'],
    [Environment.TEST]: ['test.4spm.org']
  },
  
  // Environment variables for React
  // The standard React environment variables are prefixed with REACT_APP_
  environmentVars: {
    NODE_ENV: process.env.NODE_ENV,
    ENVIRONMENT: process.env.REACT_APP_ENVIRONMENT,
    API_URL: process.env.REACT_APP_API_URL,
    AUTH_TENANT: process.env.REACT_APP_AUTH_TENANT
  },
  
  // Default environment - will be used if no other detection methods match
  defaultEnvironment: Environment.DEVELOPMENT
};

/**
 * Detects the current environment based on multiple sources:
 * 1. Explicit environment variable settings
 * 2. Domain-based detection
 * 3. Default fallback
 */
export const detectEnvironment = (): Environment => {
  // 1. Check for explicit environment setting
  if (ENV_CONFIG.environmentVars.ENVIRONMENT) {
    const envSetting = ENV_CONFIG.environmentVars.ENVIRONMENT.toLowerCase();
    if (Object.values(Environment).includes(envSetting as Environment)) {
      return envSetting as Environment;
    }
  }
  
  // 2. Domain-based detection for browser environments
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // Check each environment's domain patterns
    for (const [env, domains] of Object.entries(ENV_CONFIG.domains)) {
      if (domains.some(domain => hostname.includes(domain))) {
        return env as Environment;
      }
    }
    
    // localhost is always development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return Environment.DEVELOPMENT;
    }
  }
  
  // 3. Use NODE_ENV as fallback
  if (ENV_CONFIG.environmentVars.NODE_ENV === 'production') {
    return Environment.PRODUCTION;
  }
  
  // 4. Default fallback
  return ENV_CONFIG.defaultEnvironment;
};

/**
 * Gets the current environment
 * Memoized to avoid recalculating on every import
 */
export const CURRENT_ENVIRONMENT = detectEnvironment();

/**
 * Utility function to check if we're in a specific environment
 */
export const isEnvironment = (env: Environment): boolean => {
  return CURRENT_ENVIRONMENT === env;
};

/**
 * Common environment checks
 */
export const isDevelopment = (): boolean => isEnvironment(Environment.DEVELOPMENT);
export const isStaging = (): boolean => isEnvironment(Environment.STAGING);
export const isProduction = (): boolean => isEnvironment(Environment.PRODUCTION);
export const isTest = (): boolean => isEnvironment(Environment.TEST);
