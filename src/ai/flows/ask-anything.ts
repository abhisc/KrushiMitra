"use server";

import { ai } from "@/ai/genkit";
import { z } from "zod";
import { fetchMarketDataTool } from "./real-time-market-analysis";
import { fetchDistrictsTool } from "../tools/GovtApisTools";
import {
	getCurrentWeather,
	getWeatherForecast,
} from "./weather-and-irrigation-tips";
import { marketplaceTool } from "../tools/marketplace-tool";

const AskAnythingInputSchema = z.object({
	text: z.string(),
	messages: z
		.array(
			z.object({
				role: z
					.string()
					.describe("The role of the message sender, e.g., 'user' or 'model'."),
				content: z
					.array(z.object({ text: z.string() }))
					.describe(
						"The content of the message, which can be a string or an array of strings.",
					),
			}),
		)
		.optional()
		.describe(
			"An array of messages to provide context for the AI assistant. Each message should have a role (user or assistant) and content.",
		),
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
	moveToOtherPage: z
		.object({
			page: z
				.string()
				.describe(
					`The page to move the user to: ["/market", "/weather"], else it will be empty.`,
				),
			confirmed: z
				.boolean()
				.describe("Movement to next page is confirmed by user."),
		})
		.required(),
});
export type AskAnythingOutput = z.infer<typeof AskAnythingOutputSchema>;

export async function AskAnything(
	input: AskAnythingInput,
): Promise<AskAnythingOutput> {
	return askAnythingFlow(input);
}

const promptText = `AI Assistant for Indian Farmers
You are an AI assistant designed to support Indian farmers with practical, actionable farming solutions and market insights tailored to their needs.
Instructions:

Tool Usage:

You are free to use any tool available to you.
Use the fetchDistricts tool to verify and correct district name spellings for any mentioned location.
For weather-related queries, use the getCurrentWeather tool to provide accurate, location-specific weather forecasts.
For market trend queries, use the fetchMarketData tool to retrieve real-time market data and apply the marketAnalysisTool to generate detailed insights.
If data from any tool is unavailable, note it and suggest practical alternatives (e.g., nearby markets or general trends).


Response Guidelines:

Deliver concise, actionable solutions tailored to the farmer’s query (e.g., crop management, pest control, or market strategies).
For farming issues, express empathy and provide specific, practical solutions to the problem.
For market trend requests, include:
Current prices (INR per unit, e.g., quintal/kg) for specified or common crops.
Price trends (increasing, decreasing, or stable) over the past week or month.
Key market insights (e.g., supply/demand dynamics, seasonal factors).
Actionable recommendations (e.g., best crops to sell/hold, alternative markets).
You can through previous messages to understand the context of the query and provide relevant information.


If no crops or location are specified, analyze 3–5 common Indian crops (e.g., rice, wheat, onion, tomato, potato) in a major market (e.g., Nashik, Delhi, Azadpur).
Ensure responses are farmer-friendly, avoiding technical jargon unless explained simply.


Page Navigation:

Suggest moving the user to a specialized page only when their query requires extensive details. Use the moveToOtherPage function in the output, but set confirmed: false unless the user explicitly confirms the navigation. Suggested pages:
/weather: For detailed weather forecasts or climate-related queries.
/market: For in-depth market price analysis or crop trading insights.
/diagnose: For crop disease or pest identification and solutions.
/schemes: For queries about government farming schemes or subsidies.
/plantationFlow: For creating detailed cropping or plantation plans.
/journal: For recording or reviewing farming activities.
/plan: To create short plan, like a reminder for farming tasks or activities.
/expert-connect: For connecting with agricultural experts or specialists.
/profile: For managing user profile and preferences.

Clearly explain why the page is recommended. When user confirms navigation, set confirmed: true and specify the page in the output.


Output Structure:

Overview: Briefly summarize the query context, including location and crops (if provided).
Solution/Analysis: Provide a clear, concise solution or market analysis with relevant details.
Recommendations: Offer practical, farmer-centric advice based on the solution or analysis.
End with “Good luck with your farming!” for farming-related queries to encourage the user.
If suggesting navigation, include a note like: “For more details, I can guide you to [page]. Would you like to proceed?”


Photo Handling:

If a photo is provided via {{photoDataUri}}, analyze it for crop health, pest issues, or other relevant factors using available image analysis capabilities.
Integrate findings into the Solution/Analysis section and provide specific recommendations based on the visual data.
If the photo cannot be analyzed, note the limitation and offer text-based advice.



Input Fields:
Text: {{text}}
Photo: {{#if photoDataUri}}{{media url=photoDataUri}}{{/if}}
`;

const checkFlashMessage = (messages: any) => {
	return ai.definePrompt({
		name: "checkFlashMessage",
		model: "googleai/gemini-1.5-flash",
		messages,
		input: { schema: AskAnythingInputSchema },
		output: {
			schema: z.object({
				response: z.string(),
				tooMuchForMe: z.boolean(),
			}),
		},
		prompt: `
		You are an AI assistant designed to engage small talks with Indian farmers.
		Your task is to provide concise, practical responses to farmers' queries based on the provided input.
		If the query is little complex or requires more details or external calls, you will return a tooMuchForMe in output indicating that it is beyond your scope to address.
    You can through previous messages to understand the context of the query and provide relevant information.
		 
		Input Fields:
		Text: {{text}}
		Photo: {{#if photoDataUri}}{{media url=photoDataUri}}{{/if}}
		`,
	});
};

const prompt = (messages: any) => {
	return ai.definePrompt({
		name: "askAnythingPrompt",
		input: { schema: AskAnythingInputSchema },
		output: { schema: AskAnythingOutputSchema },
		messages,
		tools: [
			fetchMarketDataTool,
			fetchDistrictsTool,
			getCurrentWeather,
			getWeatherForecast,
		],
		prompt: promptText,
	});
};

const askAnythingFlow = ai.defineFlow(
	{
		name: "askAnythingFlow",
		inputSchema: AskAnythingInputSchema,
		outputSchema: AskAnythingOutputSchema,
	},
	async (input) => {
		console.log(input);
		const checkFlash = await checkFlashMessage(input.messages)(input);
		console.log(checkFlash?.output);
		if (checkFlash?.output?.tooMuchForMe) {
			const { output } = await prompt(input.messages)(input);
			return output! as AskAnythingOutput;
		} else {
			return {
				response: checkFlash.output?.response || "",
				moveToOtherPage: { page: "", confirmed: false },
			} as AskAnythingOutput;
		}
	},
);
