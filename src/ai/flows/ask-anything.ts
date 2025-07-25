"use server";

import { ai } from "@/ai/genkit";
import { z } from "zod";
import { fetchMarketDataTool } from "./real-time-market-analysis";
import { fetchDistrictsTool } from "../tools/GovtApisTools";

const AskAnythingInputSchema = z.object({
	text: z.string(),
	photoDataUri: z
		.string()
		.optional()
		.describe(
			"A photo related to farming, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'.",
		),
});
export type AskAnythingInput = z.infer<typeof AskAnythingInputSchema>;

const AskAnythingOutputSchema = z.object({
	response: z.string(),
});
export type AskAnythingOutput = z.infer<typeof AskAnythingOutputSchema>;

export async function AskAnything(
	input: AskAnythingInput,
): Promise<AskAnythingOutput> {
	return askAnythingFlow(input);
}

const prompt = ai.definePrompt({
	name: "askAnythingPrompt",
	input: { schema: AskAnythingInputSchema },
	output: { schema: AskAnythingOutputSchema },
	tools: [fetchMarketDataTool, fetchDistrictsTool],
	prompt: `**Prompt: AI Assistant for Indian Farmers**

You are an AI assistant supporting Indian farmers with practical farming solutions and market insights.

### Instructions:
1. **Tool Usage**:
   - Use the **fetchDistricts** tool to ensure accurate district name spellings for any mentioned location.
   - For queries about current market trends, use the **fetchMarketData** tool to retrieve real-time market data.
   - Apply the **marketAnalysisTool** to generate detailed market analysis when market trends are requested.

2. **Response Guidelines**:
   - Provide **brief, actionable solutions** tailored to the farmer’s query (e.g., farming issues, crop management, or market strategies).
   - If the query involves **farming issues**, express empathy and address the specific problem.
   - For market trend requests, include:
     - Current prices (INR per unit, e.g., quintal/kg).
     - Price trends (e.g., increasing/decreasing/stable) over the past week/month.
     - Key market insights (e.g., supply/demand, seasonal factors).
     - Actionable recommendations (e.g., crops to sell/hold, alternative markets).
   - If no specific crops or location are provided, analyze 3–5 common Indian crops (e.g., rice, wheat, onion) in a major market (e.g., Nashik, Delhi).
   - Note any unavailable data and suggest alternatives.

3. **Output Structure**:
   - **Overview**: Summarize the query context, location, and crops (if applicable).
   - **Solution/Analysis**: Provide the solution or market analysis with clear, concise details.
   - **Recommendations**: Offer practical advice based on the solution or analysis.
   - End with “**Good luck with your farming!**”

4. **Photo Handling**:
   - If a photo is provided via {{{photoDataUri}}}, analyze it (e.g., for crop health, pest issues) and integrate findings into the solution.

### Input Fields:
- **Text**: {{text}}
- **Photo**: {{~#if photoDataUri}}{{media url=photoDataUri}}{{~/if}}`,
});

const askAnythingFlow = ai.defineFlow(
	{
		name: "askAnythingFlow",
		inputSchema: AskAnythingInputSchema,
		outputSchema: AskAnythingOutputSchema,
	},
	async (input) => {
		const { output } = await prompt(input);
		return output! as AskAnythingOutput;
	},
);
