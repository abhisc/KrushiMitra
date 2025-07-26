/**
 * MCP Client utility for interacting with the KrushiMitra MCP Server
 */

export class MCPClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api/mcp-server') {
    this.baseUrl = baseUrl;
  }

  async getServerInfo() {
    const response = await fetch(this.baseUrl, {
      method: 'GET',
    });
    return response.json();
  }

  async callFlow(flowName: string, input: any) {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: flowName,
        input,
      }),
    });
    return response.json();
  }

  async callTool(toolName: string, input: any) {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: toolName,
        input,
      }),
    });
    return response.json();
  }

  // Convenience methods for specific flows
  async diagnoseCropDisease(input: any) {
    return this.callFlow('diagnoseCropDisease', input);
  }

  async diagnoseFollowUp(input: any) {
    return this.callFlow('diagnoseFollowUp', input);
  }

  async askAnything(input: any) {
    return this.callFlow('askAnything', input);
  }

  async getWeatherAndIrrigationTips(input: any) {
    return this.callFlow('getWeatherAndIrrigationTips', input);
  }

  async getMarketplaceChatResponse(input: any) {
    return this.callFlow('getMarketplaceChatResponse', input);
  }

  async getMarketplaceSearch(input: any) {
    return this.callFlow('getMarketplaceSearch', input);
  }

  async getMarketAnalysis(input: any) {
    return this.callFlow('getMarketAnalysis', input);
  }

  async farmJournalExtract(input: any) {
    return this.callFlow('farmJournalExtract', input);
  }

  async handleFarmerSchemeQuery(input: any) {
    return this.callFlow('handleFarmerSchemeQuery', input);
  }

  // Convenience methods for specific tools
  async getCurrentWeather(input: any) {
    return this.callTool('getCurrentWeather', input);
  }

  async getMarketplaceData(input: any) {
    return this.callTool('getMarketplaceData', input);
  }

  async getGovernmentSchemeInfo(input: any) {
    return this.callTool('getGovernmentSchemeInfo', input);
  }

  async getDistrictsData(input: any) {
    return this.callTool('getDistrictsData', input);
  }
}

// Export a default instance
export const mcpClient = new MCPClient();
export default mcpClient; 