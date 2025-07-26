import { z } from 'zod';
import { ai } from '@/ai/genkit';
import { mcpClient } from '@/utils/mcp-client';

export const SmartDiagnoseInputSchema = z.object({
  photoDataUri: z.string().optional(),
  text: z.string(),
});
export type SmartDiagnoseInput = z.infer<typeof SmartDiagnoseInputSchema>;

export const SmartDiagnoseOutputSchema = z.object({
  response: z.string(),
});
export type SmartDiagnoseOutput = z.infer<typeof SmartDiagnoseOutputSchema>;

// AI-powered service discovery and selection prompt
const serviceDiscoveryPrompt = ai.definePrompt({
  name: 'serviceDiscoveryPrompt',
  input: {
    schema: z.object({
      userQuery: z.string().describe("The user's query"),
      photoDataUri: z.string().optional().describe("Optional photo data"),
      availableFlows: z.array(z.string()).describe("Available MCP flows"),
      availableTools: z.array(z.string()).describe("Available MCP tools")
    })
  },
  output: {
    schema: z.object({
      selectedService: z.string().describe("The service to use"),
      reasoning: z.string().describe("Why this service was selected"),
      extractedParams: z.record(z.string(), z.any()).describe("Parameters extracted from the query"),
      confidence: z.number().describe("Confidence in the selection (0-1)")
    })
  },
  prompt: `You are an intelligent AI assistant that helps farmers by routing their queries to the most appropriate specialized service.

Available MCP Flows: {{{availableFlows}}}
Available MCP Tools: {{{availableTools}}}

User Query: {{{userQuery}}}
{{~#if photoDataUri}}Photo provided: Yes{{~/if}}

Based on the user's query, analyze which service would be most appropriate to handle their request. Consider:
1. The nature of the query (diagnosis, weather, market, marketplace, schemes, general advice)
2. Whether a photo is provided (important for diagnosis)
3. The specific keywords and context in the query
4. The user's intent and what they're trying to accomplish

Select the most appropriate service from the available flows and tools. Also extract any relevant parameters from the query that might be needed by the selected service.

Respond with:
- selectedService: The name of the service to use
- reasoning: Why you chose this service
- extractedParams: Any parameters you can extract from the query (location, crop type, etc.)
- confidence: Your confidence level (0-1)`
});

export async function smartDiagnose(
  input: SmartDiagnoseInput
): Promise<string> {
  const { photoDataUri, text } = input;

  try {
    // Get available MCP resources dynamically from the server
    const serverInfo = await mcpClient.getServerInfo();
    const availableFlows = serverInfo.flows || [];
    const availableTools = serverInfo.tools || [];

    console.log('Available MCP Resources:', { flows: availableFlows, tools: availableTools });

    // Use AI to intelligently select the appropriate service
    const { output } = await serviceDiscoveryPrompt({
      userQuery: text,
      photoDataUri,
      availableFlows,
      availableTools
    });

    console.log('AI Service Selection:', output);

    // Handle null output case
    if (!output) {
      const generalResult = await mcpClient.callFlow('askAnything', { text, photoDataUri });
      return generalResult.result?.response || "I couldn't process your request. Please try again.";
    }

    // Route to the selected service using MCP client
    const selectedService = output.selectedService;
    
    // Check if it's a flow or tool
    if (availableFlows.includes(selectedService)) {
      // Call the flow using MCP client
      const result = await mcpClient.callFlow(selectedService, {
        text,
        photoDataUri,
        ...output.extractedParams
      });
      
      return result.result?.response || JSON.stringify(result.result);
    } else if (availableTools.includes(selectedService)) {
      // Call the tool using MCP client
      const result = await mcpClient.callTool(selectedService, {
        ...output.extractedParams
      });
      
      return result.result?.response || JSON.stringify(result.result);
    } else {
      // Fallback to general AI assistant
      const generalResult = await mcpClient.callFlow('askAnything', { text, photoDataUri });
      return generalResult.result?.response || "I couldn't find the appropriate service. Please try again.";
    }

  } catch (error) {
    console.error('Smart diagnose error:', error);
    // Fallback to general AI assistant
    try {
      const generalResult = await mcpClient.callFlow('askAnything', { text, photoDataUri });
      return generalResult.result?.response || "I encountered an error. Please try again.";
    } catch (fallbackError) {
      return "I'm having trouble processing your request. Please try again later.";
    }
  }
}

// Define the flow using ai.defineFlow
const smartDiagnoseFlow = ai.defineFlow(
  {
    name: "smartDiagnoseFlow",
    inputSchema: SmartDiagnoseInputSchema,
    outputSchema: SmartDiagnoseOutputSchema,
  },
  async (input) => {
    const response = await smartDiagnose(input);
    return { response };
  },
);

export { smartDiagnoseFlow }; 