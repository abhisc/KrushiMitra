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

// Create a simple MCP-like server interface
export class KrushiMitraMCPServer {
  private name = 'krushimitra-ai-server';
  private version = '1.0.0';

  // Expose flows as methods
  async diagnoseCropDisease(input: any) {
    return await diagnoseCropDisease(input);
  }

  async diagnoseFollowUp(input: any) {
    return await diagnoseFollowUp(input);
  }

  async askAnything(input: any) {
    return await AskAnything(input);
  }

  async getWeatherAndIrrigationTips(input: any) {
    return await getWeatherAndIrrigationTips(input);
  }

  async getMarketplaceChatResponse(input: any) {
    return await getMarketplaceChatResponse(input);
  }

  async getMarketplaceSearch(input: any) {
    return await getMarketplaceSearch(input);
  }

  async getMarketAnalysis(input: any) {
    return await getMarketAnalysis(input);
  }

  async farmJournalExtract(input: any) {
    return await farmJournalExtractFlow(input);
  }

  async handleFarmerSchemeQuery(input: any) {
    return await handleFarmerSchemeQuery(input);
  }

  // Expose tools as methods
  async getCurrentWeather(input: any) {
    return await getCurrentWeather(input);
  }

  async getMarketplaceData(input: any) {
    return await marketplaceTool(input);
  }

  async getGovernmentSchemeInfo(input: any) {
    return await getGovernmentSchemeInfo(input);
  }

  async getDistrictsData(input: any) {
    return await fetchDistrictsTool(input);
  }

  // Get server info
  getInfo() {
    return {
      name: this.name,
      version: this.version,
      flows: [
        'diagnoseCropDisease',
        'diagnoseFollowUp', 
        'askAnything',
        'getWeatherAndIrrigationTips',
        'getMarketplaceChatResponse',
        'getMarketplaceSearch',
        'getMarketAnalysis',
        'farmJournalExtract',
        'handleFarmerSchemeQuery'
      ],
      tools: [
        'getCurrentWeather',
        'getMarketplaceData',
        'getGovernmentSchemeInfo',
        'getDistrictsData'
      ]
    };
  }
}

// Create and export the server instance
export const server = new KrushiMitraMCPServer();
export default server; 