'use server';

/**
 * @fileOverview A flow to handle farmer scheme queries in the chat interface.
 *
 * - handleFarmerSchemeQuery - A function that processes chat queries about government schemes.
 * - FarmerSchemeQueryInput - The input type for the chat query.
 * - FarmerSchemeQueryOutput - The return type for the chat response.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { getFarmerSchemes } from '../tools/government-scheme-information';

const FarmerSchemeQueryInputSchema = z.object({
  query: z.string().describe('The user\'s question about government schemes'),
  userState: z.string().optional().describe('User\'s state (if mentioned in query)'),
  userAge: z.number().optional().describe('User\'s age (if mentioned in query)'),
  userGender: z.string().optional().describe('User\'s gender (if mentioned in query)'),
});

export type FarmerSchemeQueryInput = z.infer<typeof FarmerSchemeQueryInputSchema>;

const FarmerSchemeQueryOutputSchema = z.object({
  response: z.string().describe('AI response about government schemes'),
  schemes: z.array(
    z.object({
      name: z.string().describe('Scheme name'),
      description: z.string().describe('Scheme description'),
      benefits: z.string().optional().describe('Benefits offered'),
      eligibility: z.string().optional().describe('Eligibility criteria'),
    })
  ).describe('List of relevant government schemes'),
  hasSchemes: z.boolean().describe('Whether schemes were found'),
});

export type FarmerSchemeQueryOutput = z.infer<typeof FarmerSchemeQueryOutputSchema>;

// Function to extract information from user query
function extractSchemeInfo(query: string): {
  state?: string;
  age?: number;
  gender?: string;
  keyword?: string;
} {
  const info: any = {};
  
  // Extract state
  const stateMatch = query.match(/(?:in|from|of)\s+([A-Za-z\s]+)(?:state|province)?/i);
  if (stateMatch) {
    info.state = stateMatch[1].trim();
  }
  
  // Extract age
  const ageMatch = query.match(/(\d+)\s*(?:years?\s*old|age)/i);
  if (ageMatch) {
    info.age = parseInt(ageMatch[1]);
  }
  
  // Extract gender
  if (query.match(/\b(male|man|boy)\b/i)) {
    info.gender = 'Male';
  } else if (query.match(/\b(female|woman|girl)\b/i)) {
    info.gender = 'Female';
  }
  
  // Extract keywords
  const keywords = ['loan', 'subsidy', 'insurance', 'equipment', 'seed', 'fertilizer', 'irrigation'];
  for (const keyword of keywords) {
    if (query.toLowerCase().includes(keyword)) {
      info.keyword = keyword;
      break;
    }
  }
  
  return info;
}

export async function handleFarmerSchemeQuery(input: FarmerSchemeQueryInput): Promise<FarmerSchemeQueryOutput> {
  try {
    // Extract information from the query
    const extractedInfo = extractSchemeInfo(input.query);
    
    // Determine state to search
    const state = input.userState || extractedInfo.state || 'Karnataka'; // Default state
    
    // Use the getFarmerSchemes tool
    const result = await getFarmerSchemes({
      occupation: "Farmer",
      residence: "Rural",
      state: state,
      age: input.userAge || extractedInfo.age,
      gender: input.userGender || extractedInfo.gender || "All",
      keyword: extractedInfo.keyword,
    });

    // Transform schemes to output format
    const schemes = result.schemes.map(scheme => ({
      name: scheme.name,
      description: scheme.description,
      benefits: scheme.benefits,
      eligibility: scheme.eligibility,
    }));

    // Generate response based on results
    let response = '';
    if (result.totalResults > 0) {
      response = `I found ${result.totalResults} government schemes that may be relevant for you in ${state}. Here are some key schemes:\n\n`;
      
      // Add first few schemes to response
      schemes.slice(0, 3).forEach((scheme, index) => {
        response += `${index + 1}. **${scheme.name}**\n`;
        response += `   ${scheme.description}\n`;
        if (scheme.benefits) {
          response += `   Benefits: ${scheme.benefits}\n`;
        }
        response += '\n';
      });
      
      if (schemes.length > 3) {
        response += `... and ${schemes.length - 3} more schemes. For detailed information and application process, please visit the official MyScheme website or contact your local agricultural office.`;
      }
    } else {
      response = `I couldn't find specific government schemes for your criteria in ${state}. However, there are general agricultural schemes available. I recommend:\n\n`;
      response += `1. Contact your local agricultural office\n`;
      response += `2. Visit the official MyScheme website (www.myscheme.gov.in)\n`;
      response += `3. Check with your state's agriculture department\n`;
      response += `4. Consider broader eligibility criteria`;
    }

    return {
      response,
      schemes,
      hasSchemes: result.totalResults > 0,
    };
  } catch (error) {
    console.error('Error in handleFarmerSchemeQuery:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return {
      response: `I'm having trouble fetching government schemes right now. Please try again later or contact your local agricultural office for assistance. Error: ${errorMessage}`,
      schemes: [],
      hasSchemes: false,
    };
  }
}

// Flow for chat integration
const farmerSchemeChatFlow = ai.defineFlow(
  {
    name: 'farmerSchemeChatFlow',
    inputSchema: FarmerSchemeQueryInputSchema,
    outputSchema: FarmerSchemeQueryOutputSchema,
  },
  async input => {
    return await handleFarmerSchemeQuery(input);
  }
);

export { farmerSchemeChatFlow }; 