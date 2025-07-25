"use server";
/**
 * @fileOverview Retrieves real-time market analysis for crops, including pricing information, to help farmers make informed selling decisions.
 *
 * - getMarketAnalysis - A function that retrieves real-time market analysis.
 * - MarketAnalysisInput - The input type for the getMarketAnalysis function.
 * - MarketAnalysisOutput - The return type for the getMarketAnalysis function.
 */

import { ai } from "@/ai/genkit";
import { fetchDataFromGovtAPI } from "@/helpers/govtData/fetchGovtData";
import { ResourcesEnum } from "@/helpers/govtData/resources";
import { z } from "zod";

const MarketAnalysisInputSchema = z.object({
	state: z.string().describe("The state where the crop is grown.").optional(),
	market: z.string().describe("The market to get analysis from.").optional(),
	moreDetails: z
		.string()
		.describe("Any additional details or context for the analysis.")
		.optional(),
});
export type MarketAnalysisInput = z.infer<typeof MarketAnalysisInputSchema>;

const MarketAnalysisOutputSchema = z.object({
	overview: z
		.string()
		.describe(
			"Overall market overview and insights in around 80 words, include the time period of analysis.",
		),
	cropsData: z.array(
		z.object({
			crop: z.string().describe("The crop being analyzed."),
			market: z.string().describe("The market being analyzed."),
			price: z
				.string()
				.describe(
					"The current price of the crop in the market, do not add symbols.",
				),
			entries: z.string().describe("The number of entries for the crop."),
			trend: z
				.string()
				.describe(
					"The price trend of the crop in the market. Values: [Increasing, Decreasing, Stable]",
				),
			analysis: z
				.string()
				.describe(
					"Overall market analysis and recommendations matching the trend.",
				),
		}),
	),
});
export type MarketAnalysisOutput = z.infer<typeof MarketAnalysisOutputSchema>;

export async function getMarketAnalysis(
	input: MarketAnalysisInput,
): Promise<MarketAnalysisOutput> {
	return marketAnalysisFlow(input);
}

// Add tool for fetching market data
export const fetchMarketDataTool = ai.defineTool(
	{
		name: "fetchMarketData",
		description:
			"Fetch real-time market data from government APIs for specific state and market/district",
		inputSchema: z.object({
			state: z
				.string()
				.describe("The state to fetch market data for")
				.optional(),
			district: z
				.string()
				.describe("The district/market to fetch data for")
				.optional(),
			commodity: z
				.string()
				.describe(
					"user can provide a specific commodity to filter data, if not provide general analysis for all commodities.",
				)
				.optional(),
		}),
		outputSchema: z.object({
			success: z.boolean(),
			data: z
				.string()
				.describe(
					"Market data analysis or error message in markdown format, or ask them to check the input parameters.",
				),
			recordCount: z.number().describe("Number of records found"),
		}),
	},
	async (input) => {
		try {
			const query: any = {
				format: "json",
				offset: "0",
			};

			if (input.state) {
				query["filters[State]"] = input.state;
			}
			if (input.district) {
				query["filters[District]"] = input.district;
			}
			if (input.commodity) {
				query["filters[Commodity]"] = input.commodity;
			}

			const marketDataResponse = await fetchDataFromGovtAPI(
				ResourcesEnum["mandiPrices"],
				query,
				"60",
				3,
			);

			if (
				!marketDataResponse.records ||
				marketDataResponse.records.length === 0
			) {
				return {
					success: false,
					data: `No market data found for the specified criteria: State: ${input.state || "Any"}, District: ${input.district || "Any"}, Commodity: ${input.commodity || "Any"}`,
					recordCount: 0,
				};
			}

			const marketData = marketDataResponse.records
				.map(
					(record: any) =>
						`Crop: ${record?.Commodity || "N/A"}, Variety: ${record?.Variety || "N/A"}, Price: ${record?.Modal_Price || "N/A"}, Date: ${record?.Arrival_Date || "N/A"}, Market: ${record?.Market || record?.District || "N/A"}, State: ${record?.State || "N/A"}`,
				)
				.join("\n");

			return {
				success: true,
				data: marketData,
				recordCount: marketDataResponse.records.length,
			};
		} catch (error) {
			return {
				success: false,
				data: `Error fetching market data: ${error instanceof Error ? error.message : "Unknown error"}`,
				recordCount: 0,
			};
		}
	},
);

const prompt = ai.definePrompt({
	name: "marketAnalysisPrompt",
	input: {
		schema: MarketAnalysisInputSchema.extend({
			marketData: z
				.string()
				.describe("Optional market data to enhance analysis, if available."),
		}),
	},
	output: { schema: MarketAnalysisOutputSchema },
	prompt: `You are an AI assistant providing real-time market analysis for farmers to support decision-making. Analyze current prices, trends, and market conditions for specified crops in the given state and market, using provided market data or the latest available data for Indian agricultural markets if none is provided.

Instructions:
Input Usage:
If user sends some gibberish in "More Details" which is unrelated to agriculture, farming, farmers, city and districts or places, tell them it is beyond you scope to address.
Prioritize details in "More Details" for crop selection and analysis.
Analyze user-specified crops from "More Details" or, if none are mentioned, select only 15 valuable crops relevant to the state/market (or Indian markets if unspecified).
If data for specified crops, state, or market is unavailable, note this in the "Overview" and analyze alternative relevant crops/markets.
Always mention date range of analysis and number of crops analyzed and places in the overview.

Data Handling:
Use provided "Market Data" if available; otherwise, source the latest Indian agricultural market data, prioritizing the specified state/market.
If state/market is unspecified, use national or regional Indian market data.
If you see the same crop multiple times on the same day, average it as one crop for analysis.

Analysis:
For each crop, provide:
Current price.
Price trend (e.g., increasing/decreasing/stable) over the past week/month.
Market insights (e.g., supply/demand, seasonal factors, external influences).

Output:
Overview: Summarize the state, market, crops analyzed, and any missing data issues.
Crop Analysis: List current price, trend, and insights for each crop.
Recommendations: Offer actionable advice (e.g., crops to sell/hold, alternative markets, risk mitigation).

Input Fields:
State: {{{state}}}
Market: {{{market}}}
Market Data: {{{marketData}}}
More Details: {{{moreDetails}}}`,
});

const marketAnalysisFlow = ai.defineFlow(
	{
		name: "marketAnalysisFlow",
		inputSchema: MarketAnalysisInputSchema,
		outputSchema: MarketAnalysisOutputSchema,
	},
	async (input) => {
		const query = {
			"filters[State]": input.state,
			"filters[District]": input.market,
		};
		const marketDataResponse = await fetchDataFromGovtAPI(
			ResourcesEnum["mandiPrices"],
			query,
		);

		if (
			!marketDataResponse.records ||
			marketDataResponse.records.length === 0
		) {
			throw new Error(
				`No market data found for state "${input.state}" in market "${input.market}".`,
			);
		}

		const marketData = marketDataResponse.records
			.map(
				(record: any) =>
					`Crop: ${record?.Commodity}, Variety: ${record?.Variety},Price: ${record?.Modal_Price}, Date: ${record?.Arrival_Date}, Place: ${record?.District}`,
			)
			.join("\n");

		const { output } = await prompt({ ...input, marketData });
		return output!;
	},
);
