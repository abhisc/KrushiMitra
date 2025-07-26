import { NextApiRequest, NextApiResponse } from 'next';
import { server } from '@/ai/mcp-server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Return server info
    return res.status(200).json(server.getInfo());
  }

  if (req.method === 'POST') {
    const { action, input } = req.body;

    if (!action) {
      return res.status(400).json({ error: 'Action is required' });
    }

    try {
      let result;
      
      // Handle flows
      switch (action) {
        case 'diagnoseCropDisease':
          result = await server.diagnoseCropDisease(input);
          break;
        case 'diagnoseFollowUp':
          result = await server.diagnoseFollowUp(input);
          break;
        case 'askAnything':
          result = await server.askAnything(input);
          break;
        case 'getWeatherAndIrrigationTips':
          result = await server.getWeatherAndIrrigationTips(input);
          break;
        case 'getMarketplaceChatResponse':
          result = await server.getMarketplaceChatResponse(input);
          break;
        case 'getMarketplaceSearch':
          result = await server.getMarketplaceSearch(input);
          break;
        case 'getMarketAnalysis':
          result = await server.getMarketAnalysis(input);
          break;
        case 'farmJournalExtract':
          result = await server.farmJournalExtract(input);
          break;
        case 'handleFarmerSchemeQuery':
          result = await server.handleFarmerSchemeQuery(input);
          break;
        // Handle tools
        case 'getCurrentWeather':
          result = await server.getCurrentWeather(input);
          break;
        case 'getMarketplaceData':
          result = await server.getMarketplaceData(input);
          break;
        case 'getGovernmentSchemeInfo':
          result = await server.getGovernmentSchemeInfo(input);
          break;
        case 'getDistrictsData':
          result = await server.getDistrictsData(input);
          break;
        default:
          return res.status(400).json({ error: `Unknown action: ${action}` });
      }

      return res.status(200).json({ result });
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