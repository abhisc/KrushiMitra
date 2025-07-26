'use server';

import { ai } from './genkit';

// Import all flows
import { diagnoseCropDisease, diagnoseFollowUp } from './flows/diagnose-crop-disease';
import { AskAnything } from './flows/ask-anything';
import { getWeatherAndIrrigationTips } from './flows/weather-and-irrigation-tips';
import { getMarketplaceChatResponse } from './flows/marketplace-chat';
import { getMarketplaceSearch } from './flows/farming-marketplace';
import { getMarketAnalysis } from './flows/real-time-market-analysis';
import { farmJournalExtractFlow } from './flows/farm-journal-extract';
import { handleFarmerSchemeQuery } from './flows/farmer-schemes-chat';

// Import all tools
import { getCurrentWeather } from './tools/weather-tool';
import { marketplaceTool } from './tools/marketplace-tool';
import { getGovernmentSchemeInfo } from './tools/government-scheme-information';
import { fetchDistrictsTool } from './tools/GovtApisTools';

// Export all flows and tools for use in the application
export {
  // Flows
  diagnoseCropDisease,
  diagnoseFollowUp,
  AskAnything,
  getWeatherAndIrrigationTips,
  getMarketplaceChatResponse,
  getMarketplaceSearch,
  getMarketAnalysis,
  farmJournalExtractFlow,
  handleFarmerSchemeQuery,
  
  // Tools
  getCurrentWeather,
  marketplaceTool,
  getGovernmentSchemeInfo,
  fetchDistrictsTool,
  
  // AI instance
  ai,
}; 