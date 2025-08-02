"use server";

/**
 * @fileOverview Retrieves real-time market analysis for crops, including pricing information, to help farmers make informed selling decisions.
 *
 * - getMarketAnalysis - A function that retrieves real-time market analysis.
 * - MarketAnalysisInput - The input type for the getMarketAnalysis function.
 * - MarketAnalysisOutput - The return type for the getMarketAnalysis function.
 */

import { z } from "zod";
import { ai } from "@/ai/genkit";
import { fetchDistrictsTool } from "../tools/GovtApisTools";
import { fetchMarketDataTool } from "./real-time-market-analysis";
import { getWeatherForecast } from "./weather-and-irrigation-tips";

const PlantationFlowsInputSchema = z.object({
	state: z.string().describe("The state to fetch plantation flows for"),
	market: z
		.string()
		.describe("The market/district to fetch plantation flows for"),
	crops: z
		.array(z.string())
		.describe(
			"List of crops to include in the plantation flow. If not provided, all crops will be considered.",
		)
		.optional(),
	moreDetails: z
		.string()
		.describe(
			"Additional details or context for the plantation flow, such as specific requirements or conditions.",
		)
		.optional(),
});

const PlantationStepSchema = z.object({
	id: z
		.string()
		.describe(
			"A unique identifier for the plantation step, used for tracking and management.",
		),
	name: z
		.string()
		.describe(
			"The name of the plantation step, like watering, fertilizing, etc.",
		),
	description: z
		.string()
		.describe(
			"A brief description of the step, including its purpose and importance.",
		),
	startDate: z
		.string()
		.describe(
			"The start date of the plantation step. This is when the step should begin.",
		),
	endDate: z
		.string()
		.describe(
			"The end date of the plantation step. This is when the step should be completed.",
		),
	status: z.enum(["Pending", "Ongoing", "Completed", "Aborted"]),
});

const PlantationCycleSchema = z.object({
	id: z
		.string()
		.describe(
			"A unique identifier for the plantation step, used for tracking and management.",
		),
	name: z.string().describe("The name of the plant."),
	area: z.string().describe("Area in acre in which the plantation should happen."),
	expectedIncome: z.number().describe("Expected income at the end of cycle in rupees."),
	description: z
		.string()
		.describe("A brief description of the plant, and why was it chosen."),
	startDate: z
		.string()
		.describe(
			"The start date of the plantation cycle. This is when the plantation process should begin.",
		),
	endDate: z
		.string()
		.describe(
			"The end date of the plantation cycle. This is when the plantation process should be completed.",
		),
	cycle: z.array(PlantationStepSchema),
	status: z.enum(["Pending", "Ongoing", "Completed", "Aborted"]),
});

const PlantationFlowDataSchema = z.object({
	id: z
		.string()
		.describe(
			"A unique identifier for the plantation step, used for tracking and management.",
		),
	name: z.string().describe("The name of the plantation flow"),
	description: z.string().optional(),
	crops: z.array(PlantationCycleSchema),
	aiSuggestedDeviation: z.array(PlantationCycleSchema),
	status: z.enum(["Pending", "Ongoing", "Aborted", "Completed"]),
	startDate: z
		.string()
		.describe(
			"The start date of the plantation flow. This is when the plantation process begins.",
		),
	endDate: z
		.string()
		.describe(
			"The tentative end date of the plantation flow. This is when the plantation process should be completed.",
		),
});

export type PlantationStep = z.infer<typeof PlantationStepSchema>;
export type PlantationCycle = z.infer<typeof PlantationCycleSchema>;
export type PlantationFlowData = z.infer<typeof PlantationFlowDataSchema>;

// Add tool for fetching market data
// export const getPlantationCyclesTool = ai.defineTool(
// 	{
// 		name: "getPlantationCyclesTool",
// 		description:
// 			"Fetches real-time market analysis for specified crops, states, and markets to help farmers make informed decisions.",
// 		inputSchema: PlantationFlowsInputSchema,
// 		outputSchema: PlantationFlowDataSchema,
// 	},
// 	async (input) => {
// 		try {
// 			const query: any = {
// 				format: "json",
// 				offset: "0",
// 			};

// 			if (input.state) {
// 				query["filters[State]"] = input.state;
// 			}
// 			if (input.district) {
// 				query["filters[District]"] = input.district;
// 			}
// 			if (input.commodity) {
// 				query["filters[Commodity]"] = input.commodity;
// 			}

// 			const marketDataResponse = await fetchDataFromGovtAPI(
// 				ResourcesEnum["mandiPrices"],
// 				query,
// 				"60",
// 				5,
// 			);
// 			console.log(marketDataResponse);

// 			if (
// 				!marketDataResponse.records ||
// 				marketDataResponse.records.length === 0
// 			) {
// 				return {
// 					success: false,
// 					data: `No market data found for the specified criteria: State: ${input.state || "Any"}, District: ${input.district || "Any"}, Commodity: ${input.commodity || "Any"}`,
// 					recordCount: 0,
// 				};
// 			}

// 			const marketData = marketDataResponse.records
// 				.map(
// 					(record: any) =>
// 						`Crop: ${record?.Commodity || "N/A"}, Variety: ${record?.Variety || "N/A"}, Price: ${record?.Modal_Price || "N/A"}, Date: ${record?.Arrival_Date || "N/A"}, Market: ${record?.Market || record?.District || "N/A"}, State: ${record?.State || "N/A"}`,
// 				)
// 				.join("\n");

// 			return {
// 				success: true,
// 				data: marketData,
// 				recordCount: marketDataResponse.records.length,
// 			};
// 		} catch (error) {
// 			return {
// 				success: false,
// 				data: `Error fetching market data: ${error instanceof Error ? error.message : "Unknown error"}`,
// 				recordCount: 0,
// 			};
// 		}
// 	},
// );

const prompt = ai.definePrompt({
	name: "get",
	input: {
		schema: PlantationFlowsInputSchema,
	},
	output: { schema: PlantationFlowDataSchema },
	tools: [getWeatherForecast, fetchDistrictsTool, fetchMarketDataTool],
	prompt: `You are an AI assistant helping farmers with plantation flows.
Your task is to provide a detailed plantation flow based on the provided input.
You will always fetch district names for the given state using fetchDistrictsTool, to correct the market name if needed.
You always will use getWeatherForecast and fetchMarketDataTool to get market and weather data.

you will always consider what is provided in {{moreDetails}}.

You will provide multiple crop plantations. same crops could have multiple cycles.

User Inputs:
- State: {{state}}
- Market: {{market}}
- Crops: {{crops}}
- More Details: {{moreDetails}}
`,
});

export const GetPlantationFlow = ai.defineFlow(
	{
		name: "marketAnalysisFlow",
		inputSchema: PlantationFlowsInputSchema,
		outputSchema: PlantationFlowDataSchema,
	},
	async (input) => {
		const { output } = await prompt({ ...input });
		return output!;
	},
);
