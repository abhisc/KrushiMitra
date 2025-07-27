import { NextApiRequest, NextApiResponse } from 'next';
import { server } from '@/ai/mcp-server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Return server info
    return res.status(200).json(server.getInfo());
  }

  if (req.method === 'POST') {
    const { action, method, input, params } = req.body;
    const actionName = action || method;

    if (!actionName) {
      return res.status(400).json({ error: 'Action or method is required' });
    }

    try {
      let result;
      
      // Handle flows
      switch (actionName) {
        case 'diagnoseCropDisease':
          result = await server.diagnoseCropDisease(input || params);
          break;
        case 'diagnoseFollowUp':
          result = await server.diagnoseFollowUp(input || params);
          break;
        case 'askAnything':
          result = await server.askAnything(input || params);
          break;
        case 'smartDiagnose':
          result = await server.smartDiagnose(input || params);
          // smartDiagnose returns a string directly, so we need to wrap it
          result = { response: result };
          break;
        case 'getWeatherAndIrrigationTips':
          result = await server.getWeatherAndIrrigationTips(input || params);
          break;
        case 'getMarketplaceChatResponse':
          result = await server.getMarketplaceChatResponse(input || params);
          break;
        case 'getMarketplaceSearch':
          result = await server.getMarketplaceSearch(input || params);
          break;
        case 'getMarketAnalysis':
          result = await server.getMarketAnalysis(input || params);
          break;
        case 'farmJournalExtract':
          result = await server.farmJournalExtract(input || params);
          break;
        case 'handleFarmerSchemeQuery':
          result = await server.handleFarmerSchemeQuery(input || params);
          break;
        // Handle tools
        case 'getCurrentWeather':
          result = await server.getCurrentWeather(input || params);
          break;
        case 'getMarketplaceData':
          result = await server.getMarketplaceData(input || params);
          break;
        case 'getGovernmentSchemeInfo':
          result = await server.getGovernmentSchemeInfo(input || params);
          break;
        case 'getDistrictsData':
          result = await server.getDistrictsData(input || params);
          break;
        default:
          return res.status(400).json({ error: `Unknown action: ${actionName}` });
      }

      // Ensure consistent response format
      let formattedResult;
      if (typeof result === 'string') {
        formattedResult = { response: result };
      } else if (result && typeof result === 'object') {
        // If result already has a response property, use it
        if ('response' in result && typeof result.response === 'string') {
          formattedResult = result;
        } else {
          // Try to find a suitable response field
          const responseField = 
            ('text' in result && typeof result.text === 'string') ? result.text :
            ('message' in result && typeof result.message === 'string') ? result.message :
            ('content' in result && typeof result.content === 'string') ? result.content :
            ('data' in result && typeof result.data === 'string') ? result.data :
            null;
          
          if (responseField) {
            formattedResult = { response: responseField };
          } else {
            // If no clear response field, stringify the whole object
            formattedResult = { response: JSON.stringify(result, null, 2) };
          }
        }
      } else {
        formattedResult = { response: String(result) };
      }

      return res.status(200).json({ result: formattedResult });
    } catch (error) {
      console.error('MCP Server error:', error);
      return res.status(500).json({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 