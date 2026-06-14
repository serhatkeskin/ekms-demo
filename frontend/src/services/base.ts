// environmentConfig.ts - Extract your environment logic for reuse
let ENVIRONMENT = import.meta.env.MODE;

// if you want to override build environment mode - "production" to "development"
// for testing purposes use the VITE_CUSTOM_APP_ENV 
const CUSTOM_ENV = import.meta.env.VITE_CUSTOM_APP_ENV;
if (CUSTOM_ENV && CUSTOM_ENV === "development") {
  ENVIRONMENT = CUSTOM_ENV;
}

console.log("ENVIRONMENT:", ENVIRONMENT);

const API_BASE = ENVIRONMENT === "development"
  ? import.meta.env.VITE_API_BASE
  : "/api";

const SOCKET_BASE = ENVIRONMENT === "development"
  ? import.meta.env.VITE_SOCKET_BASE
  : (() => {
      if (typeof window !== "undefined" && window.location.hostname.startsWith("ekms.")) {
        return `wss://${window.location.hostname.replace(/^ekms\./, "ekms-api.")}/wsapi`;
      }
      return "wss://ekms-api.projects.serhatkeskin.com/wsapi";
    })();

console.log("API_BASE", API_BASE);
console.log("SOCKET_BASE", SOCKET_BASE);

// Environment indicator configuration
const getEnvironmentConfig = () => {
  const isDevelopment = ENVIRONMENT === "development";
  const isCustomDev = CUSTOM_ENV === "development";

  // Determine display environment
  let displayEnv = ENVIRONMENT;
  if (isCustomDev) {
    displayEnv = "development-override";
  }

  const configs = {
    development: {
      label: 'DEV',
      color: '#4CAF50',
      backgroundColor: '#E8F5E8',
      icon: '🔧',
      description: 'Development Environment',
      show: true
    },
    'development-override': {
      label: 'DEV-OVERRIDE',
      color: '#FF5722',
      backgroundColor: '#FBE9E7',
      icon: '⚠️',
      description: 'Development Override (Custom Env)',
      show: true
    },
    staging: {
      label: 'STAGING',
      color: '#2196F3',
      backgroundColor: '#E3F2FD',
      icon: '🚀',
      description: 'Staging Environment',
      show: true
    },
    test: {
      label: 'TEST',
      color: '#FF9800',
      backgroundColor: '#FFF3E0',
      icon: '🧪',
      description: 'Test Environment',
      show: true
    },
    production: {
      label: 'PROD',
      color: '#f44336',
      backgroundColor: '#ffebee',
      icon: '🔴',
      description: 'Production Environment',
      show: false // Never show in production
    }
  };

  return configs[displayEnv] || configs.development;
};

export {
  API_BASE,
  SOCKET_BASE,
  ENVIRONMENT,
  CUSTOM_ENV,
  getEnvironmentConfig
};