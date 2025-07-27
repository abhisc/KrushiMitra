/**
 * MCP Client utility for interacting with the KrushiMitra MCP Server
 */

export class MCPClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api/mcp-server') {
    this.baseUrl = baseUrl;
  }

  async getServerInfo() {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Failed to get server info:', error);
      throw error;
    }
  }

  async callFlow(flowName: string, input: any) {
    try {
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

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      
      // Handle different response formats
      if (result.error) {
        throw new Error(result.error);
      }
      
      return result;
    } catch (error) {
      console.error(`Failed to call flow ${flowName}:`, error);
      throw error;
    }
  }

  async callTool(toolName: string, input: any) {
    try {
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

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      
      // Handle different response formats
      if (result.error) {
        throw new Error(result.error);
      }
      
      return result;
    } catch (error) {
      console.error(`Failed to call tool ${toolName}:`, error);
      throw error;
    }
  }

  // Enhanced response parsing with formatting
  parseResponse(result: any): string {
    if (!result) return 'No response received';
    
    // Handle different response formats
    let responseText = '';
    if (typeof result === 'string') {
      responseText = result;
    } else if (result.result) {
      const response = result.result;
      if (typeof response === 'string') {
        responseText = response;
      } else if (response.response) {
        responseText = response.response;
      } else if (response.text) {
        responseText = response.text;
      } else if (response.message) {
        responseText = response.message;
      } else {
        responseText = JSON.stringify(response, null, 2);
      }
    } else if (result.response) {
      responseText = result.response;
    } else if (result.text) {
      responseText = result.text;
    } else if (result.message) {
      responseText = result.message;
    } else {
      responseText = JSON.stringify(result, null, 2);
    }

    // Format the response with structured headings and points
    return this.formatResponse(responseText);
  }

  // Format response with readable structure
  private formatResponse(responseText: string): string {
    try {
      // Try to parse as JSON first
      const data = JSON.parse(responseText);
      return this.formatStructuredResponse(data);
    } catch (e) {
      // If not JSON, return as is
      return responseText;
    }
  }

  // Format structured response with headings and points
  private formatStructuredResponse(data: any): string {
    let formattedResponse = '';

    // Weather and Irrigation Tips Format
    if (data.weatherForecast || data.irrigationTips) {
      formattedResponse += this.formatWeatherResponse(data);
    }
    // Disease Diagnosis Format
    else if (data.disease || data.confidence || data.symptoms) {
      formattedResponse += this.formatDiseaseResponse(data);
    }
    // Market Analysis Format
    else if (data.marketData || data.prices || data.trends) {
      formattedResponse += this.formatMarketResponse(data);
    }
    // Government Schemes Format
    else if (data.schemes || data.subsidies || data.assistance) {
      formattedResponse += this.formatSchemeResponse(data);
    }
    // General Response Format
    else {
      formattedResponse += this.formatGeneralResponse(data);
    }

    return formattedResponse;
  }

  private formatWeatherResponse(data: any): string {
    let response = '';

    // Weather Forecast Section
    if (data.weatherForecast) {
      response += '## 🌤️ **Weather Forecast Summary**\n\n';
      response += data.weatherForecast + '\n\n';
    }

    // Current Weather Conditions
    if (data.temperature || data.humidity || data.wind_speed || data.condition) {
      response += '### **Current Weather Conditions**\n';
      if (data.temperature) response += `- **Temperature**: ${data.temperature}°C\n`;
      if (data.condition) response += `- **Condition**: ${data.condition}\n`;
      if (data.humidity) response += `- **Humidity**: ${data.humidity}%\n`;
      if (data.wind_speed) response += `- **Wind Speed**: ${data.wind_speed} km/h\n`;
      if (data.precipitation) response += `- **Precipitation**: ${data.precipitation}mm\n`;
      if (data.sunrise) response += `- **Sunrise**: ${data.sunrise}\n`;
      if (data.sunset) response += `- **Sunset**: ${data.sunset}\n`;
      response += '\n';
    }

    // Irrigation Tips
    if (data.irrigationTips) {
      response += '## 💧 **Irrigation Tips**\n\n';
      response += data.irrigationTips + '\n\n';
    }

    // Recommended Crops
    if (data.recommendedCrops && data.recommendedCrops.length > 0) {
      response += '## ✅ **Recommended Crops**\n\n';
      data.recommendedCrops.forEach((crop: string, index: number) => {
        response += `${index + 1}. **${crop}**\n`;
      });
      response += '\n';
    }

    // Not Recommended Crops
    if (data.notRecommendedCrops && data.notRecommendedCrops.length > 0) {
      response += '## ❌ **Not Recommended Crops**\n\n';
      data.notRecommendedCrops.forEach((crop: string, index: number) => {
        response += `${index + 1}. **${crop}**\n`;
      });
      response += '\n';
    }

    // Detailed Recommendations with Reasons
    if (data.recommendedCropsWithReasons && data.recommendedCropsWithReasons.length > 0) {
      response += '### **Recommended Crops with Reasons**\n\n';
      data.recommendedCropsWithReasons.forEach((item: any) => {
        response += `- **${item.name}** - ${item.reason}\n`;
      });
      response += '\n';
    }

    if (data.notRecommendedCropsWithReasons && data.notRecommendedCropsWithReasons.length > 0) {
      response += '### **Not Recommended Crops with Reasons**\n\n';
      data.notRecommendedCropsWithReasons.forEach((item: any) => {
        response += `- **${item.name}** - ${item.reason}\n`;
      });
      response += '\n';
    }

    // Remedial Actions
    if (data.remedialActions) {
      response += '## 🛠️ **Remedial Actions**\n\n';
      response += data.remedialActions + '\n\n';
    }

    return response;
  }

  private formatDiseaseResponse(data: any): string {
    let response = '## 🔬 **Crop Disease Diagnosis**\n\n';

    if (data.disease) {
      response += `### **Diagnosed Disease**\n`;
      response += `- **Disease**: ${data.disease}\n`;
      if (data.confidence) {
        response += `- **Confidence**: ${(data.confidence * 100).toFixed(1)}%\n`;
      }
      response += '\n';
    }

    if (data.symptoms) {
      response += `### **Identified Symptoms**\n`;
      response += `- ${data.symptoms}\n\n`;
    }

    if (data.treatment) {
      response += `### **Treatment Recommendations**\n`;
      response += data.treatment + '\n\n';
    }

    if (data.prevention) {
      response += `### **Prevention Measures**\n`;
      response += data.prevention + '\n\n';
    }

    return response;
  }

  private formatMarketResponse(data: any): string {
    let response = '## 📊 **Market Analysis**\n\n';

    if (data.marketData) {
      response += `### **Market Data**\n`;
      response += data.marketData + '\n\n';
    }

    if (data.prices) {
      response += `### **Current Prices**\n`;
      if (Array.isArray(data.prices)) {
        data.prices.forEach((price: any) => {
          response += `- **${price.crop}**: ₹${price.price}/${price.unit}\n`;
        });
      }
      response += '\n';
    }

    if (data.trends) {
      response += `### **Price Trends**\n`;
      response += data.trends + '\n\n';
    }

    if (data.recommendations) {
      response += `### **Market Recommendations**\n`;
      response += data.recommendations + '\n\n';
    }

    return response;
  }

  private formatSchemeResponse(data: any): string {
    let response = '## 🏛️ **Government Schemes**\n\n';

    if (data.schemes && Array.isArray(data.schemes)) {
      response += `### **Available Schemes**\n`;
      data.schemes.forEach((scheme: any, index: number) => {
        response += `${index + 1}. **${scheme.name}**\n`;
        if (scheme.description) response += `   - ${scheme.description}\n`;
        if (scheme.eligibility) response += `   - **Eligibility**: ${scheme.eligibility}\n`;
        if (scheme.benefits) response += `   - **Benefits**: ${scheme.benefits}\n`;
        response += '\n';
      });
    }

    if (data.subsidies) {
      response += `### **Subsidies Available**\n`;
      response += data.subsidies + '\n\n';
    }

    if (data.assistance) {
      response += `### **Financial Assistance**\n`;
      response += data.assistance + '\n\n';
    }

    return response;
  }

  private formatGeneralResponse(data: any): string {
    let response = '## 💬 **Response**\n\n';

    if (data.response) {
      response += data.response + '\n\n';
    } else if (data.text) {
      response += data.text + '\n\n';
    } else if (data.message) {
      response += data.message + '\n\n';
    } else {
      response += JSON.stringify(data, null, 2) + '\n\n';
    }

    return response;
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

  async smartDiagnose(input: any) {
    return this.callFlow('smartDiagnose', input);
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