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
export { getGovernmentSchemeInfo, getFarmerSchemes } from './government-scheme-information';
export type { GovernmentSchemeInfoInput, GovernmentSchemeInfoOutput } from './government-scheme-information';
export { fetchDistrictsTool } from './GovtApisTools';
export { getCurrentWeather } from './weather-tool';
export { retrieveAdditionalInfoOfUser } from './user-additional-info-tool';

// Scheme Tools
export { SchemeRetrievalTool } from './scheme-retrieval-tool';
export { SchemeSearchTool } from './scheme-search-tool';

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
  farmerSchemes: 'getFarmerSchemes',
  govtApis: 'fetchDistricts',
  weather: 'getCurrentWeather',
  userAdditionalInfo: 'retrieve_additional_info_of_user',
  
  // Scheme Tools
  schemeRetrieval: 'scheme_retrieval_tool',
  schemeSearch: 'scheme_search_tool'
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
  getFarmerSchemes: "Fetch government schemes specifically for farmers from MyScheme API",
  fetchDistricts: "Government API integrations and data fetching",
  getCurrentWeather: "Weather data and forecasting services",
  retrieve_additional_info_of_user: "Retrieve additional user information including age, gender, location, and other profile data",
  scheme_retrieval_tool: "Retrieve government schemes from Firestore database with filtering and statistics",
  scheme_search_tool: "Advanced search functionality for government schemes with multiple criteria and user profile matching"
} as const; 