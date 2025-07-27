// Firebase and Firestore Tools
export { firebaseTool } from './firebase-tool';
export { firestoreTool } from './firestore-tool';
export { farmPlanningTool } from './farm-planning-tool';
export { firebaseAdminTool } from './firebase-admin-tool';

// Farm Journal Tools
export { farmJournalTool } from './farm-journal-tool';
export { journalAnalyticsTool } from './journal-analytics-tool';

// Existing Tools
export { marketplaceTool } from './marketplace-tool';
export { getGovernmentSchemeInfo } from './government-scheme-information';
export type { GovernmentSchemeInfoInput, GovernmentSchemeInfoOutput } from './government-scheme-information';
export { fetchDistrictsTool } from './GovtApisTools';
export { getCurrentWeather } from './weather-tool';

// Tool Registry for easy access
export const firebaseTools = {
  firebase: 'firebase_tool',
  firestore: 'firestore_tool',
  farmPlanning: 'farm_planning_tool',
  admin: 'firebase_admin_tool'
} as const;

export const journalTools = {
  journal: 'farm_journal_tool',
  analytics: 'journal_analytics_tool'
} as const;

export const allTools = {
  // Firebase Tools
  firebase: 'firebase_tool',
  firestore: 'firestore_tool',
  farmPlanning: 'farm_planning_tool',
  admin: 'firebase_admin_tool',
  
  // Journal Tools
  journal: 'farm_journal_tool',
  journalAnalytics: 'journal_analytics_tool',
  
  // Existing Tools
  marketplace: 'marketplace_tool',
  governmentScheme: 'getGovernmentSchemeInfo',
  govtApis: 'fetchDistricts',
  weather: 'getCurrentWeather'
} as const;

// Tool Descriptions for AI System
export const toolDescriptions = {
  firebase_tool: "Firebase services for authentication, storage, and analytics",
  firestore_tool: "Firestore database operations for CRUD, queries, and batch operations",
  farm_planning_tool: "Farm planning and task management for agricultural activities",
  firebase_admin_tool: "Administrative operations for data management and system maintenance",
  farm_journal_tool: "Farm journal management for logging activities, observations, and farm data",
  journal_analytics_tool: "Advanced analytics and insights for farm journal data analysis",
  marketplace_tool: "Marketplace operations and data management",
  getGovernmentSchemeInfo: "Government scheme information and eligibility checking",
  fetchDistricts: "Government API integrations and data fetching",
  getCurrentWeather: "Weather data and forecasting services"
} as const; 