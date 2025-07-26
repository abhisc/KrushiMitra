"use server";
/**
 * @fileOverview Chat flow for the farming marketplace that handles natural language queries about agricultural products.
 *
 * - getMarketplaceChatResponse - A function that processes natural language queries about marketplace products.
 * - MarketplaceChatInput - The input type for the getMarketplaceChatResponse function.
 * - MarketplaceChatOutput - The return type for the getMarketplaceChatResponse function.
 */

import { ai } from "@/ai/genkit";
import { z } from "zod";
import { getMarketplaceSearch, MarketplaceSearchInput } from "./farming-marketplace";

const MarketplaceChatInputSchema = z.object({
	message: z.string().describe("The user's natural language query about marketplace products"),
	context: z.string().describe("Previous conversation context").optional(),
});

export type MarketplaceChatInput = z.infer<typeof MarketplaceChatInputSchema>;

const MarketplaceChatOutputSchema = z.object({
	response: z.string().describe("Natural language response to the user's query"),
	searchResults: z.object({
		products: z.array(z.object({
			productName: z.string(),
			brand: z.string(),
			model: z.string(),
			price: z.string(),
			sellerType: z.string(),
			sellerName: z.string(),
			stockAvailability: z.string(),
			certification: z.string(),
			deliveryOptions: z.string(),
			rating: z.string(),
			contactInfo: z.string(),
			action: z.string(),
		})).optional(),
		overview: z.string().optional(),
		totalResults: z.number().optional(),
	}).optional(),
	suggestedActions: z.array(z.string()).describe("Suggested actions or follow-up questions"),
	confidence: z.number().describe("Confidence level of the response (0-1)"),
});

export type MarketplaceChatOutput = z.infer<typeof MarketplaceChatOutputSchema>;

export async function getMarketplaceChatResponse(
	input: MarketplaceChatInput,
): Promise<MarketplaceChatOutput> {
	return marketplaceChatFlow(input);
}

// Tool for extracting search parameters from natural language
export const extractSearchParamsTool = ai.defineTool(
	{
		name: "extractSearchParams",
		description: "Extract search parameters from natural language queries about agricultural products",
		inputSchema: z.object({
			message: z.string().describe("User's natural language query"),
		}),
		outputSchema: z.object({
			productType: z.string().describe("Extracted product type"),
			productName: z.string().describe("Extracted product name or brand"),
			location: z.string().describe("Extracted location"),
			budget: z.string().describe("Extracted budget range"),
			requirements: z.string().describe("Extracted additional requirements"),
			confidence: z.number().describe("Confidence in extraction (0-1)"),
		}),
	},
	async (input) => {
		// Simple keyword-based extraction
		const message = input.message.toLowerCase();
		
		let productType = "";
		let productName = "";
		let location = "";
		let budget = "";
		let requirements = "";
		
		// Extract product type
		if (message.includes("tractor") || message.includes("farm equipment")) {
			productType = "tractor";
		} else if (message.includes("fertilizer") || message.includes("urea") || message.includes("nutrient")) {
			productType = "fertilizer";
		} else if (message.includes("seed") || message.includes("planting")) {
			productType = "seeds";
		} else if (message.includes("pesticide") || message.includes("insecticide") || message.includes("fungicide")) {
			productType = "pesticides";
		} else if (message.includes("tool") || message.includes("implement")) {
			productType = "tools";
		}
		
		// Extract product name/brand
		const brands = ["mahindra", "john deere", "new holland", "bharat", "nagarjuna", "shakti", "pioneer", "mahyco", "syngenta", "bayer", "upl"];
		for (const brand of brands) {
			if (message.includes(brand)) {
				productName = brand;
				break;
			}
		}
		
		// Extract location (simple state names)
		const states = ["maharashtra", "karnataka", "punjab", "haryana", "uttar pradesh", "tamil nadu", "kerala", "andhra pradesh"];
		for (const state of states) {
			if (message.includes(state)) {
				location = state;
				break;
			}
		}
		
		// Extract budget
		const budgetMatch = message.match(/₹?(\d+(?:,\d+)*(?:-\d+(?:,\d+)*)?)/);
		if (budgetMatch) {
			budget = budgetMatch[0];
		}
		
		// Extract requirements
		const reqs = [];
		if (message.includes("govt") || message.includes("government")) reqs.push("govt certified");
		if (message.includes("organic")) reqs.push("organic");
		if (message.includes("delivery")) reqs.push("delivery available");
		if (message.includes("stock") || message.includes("available")) reqs.push("in stock");
		requirements = reqs.join(", ");
		
		return {
			productType,
			productName,
			location,
			budget,
			requirements,
			confidence: 0.8,
		};
	},
);

const prompt = ai.definePrompt({
	name: "marketplaceChatPrompt",
	input: {
		schema: MarketplaceChatInputSchema.extend({
			searchParams: z.object({
				productType: z.string(),
				productName: z.string(),
				location: z.string(),
				budget: z.string(),
				requirements: z.string(),
				confidence: z.number(),
			}).optional(),
			searchResults: z.string().optional(),
		}),
	},
	output: { schema: MarketplaceChatOutputSchema },
	prompt: `You are an AI assistant for a Farming Marketplace platform. Your role is to help farmers find agricultural products through natural conversation.

Instructions:
1. Understand the user's query and extract relevant search parameters
2. If search parameters are provided, perform a product search
3. Provide a natural, helpful response with product information
4. Include relevant details like price, seller, availability, and certifications
5. Suggest follow-up actions or questions

User Query: {{{message}}}
Context: {{{context}}}
Search Parameters: {{{searchParams}}}
Search Results: {{{searchResults}}}

Provide a conversational response that:
- Addresses the user's query directly
- Includes relevant product information if available
- Suggests next steps or follow-up questions
- Maintains a helpful, farmer-friendly tone

If no specific products are found, suggest alternatives or ask for more details.`,
});

const marketplaceChatFlow = ai.defineFlow(
	{
		name: "marketplaceChatFlow",
		inputSchema: MarketplaceChatInputSchema,
		outputSchema: MarketplaceChatOutputSchema,
	},
	async (input) => {
		// Extract search parameters from the message
		const searchParamsResult = await extractSearchParamsTool({
			message: input.message,
		});

		let searchResults = null;
		let searchResultsString = "";

		// If we have search parameters with good confidence, perform a search
		if (searchParamsResult.confidence > 0.5 && searchParamsResult.productType) {
			try {
				const searchInput: MarketplaceSearchInput = {
					productType: searchParamsResult.productType,
					productName: searchParamsResult.productName,
					location: searchParamsResult.location,
					budget: searchParamsResult.budget,
					requirements: searchParamsResult.requirements,
				};

				searchResults = await getMarketplaceSearch(searchInput);
				searchResultsString = JSON.stringify(searchResults, null, 2);
			} catch (error) {
				console.error("Error performing marketplace search:", error);
			}
		}

		const { output } = await prompt({
			...input,
			searchParams: searchParamsResult,
			searchResults: searchResultsString,
		});

		return output!;
	},
); 