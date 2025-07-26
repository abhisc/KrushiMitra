import { ai } from "@/ai/genkit";
import { z } from "zod";
import { getMarketplaceSearch, MarketplaceSearchInput } from "@/ai/flows/farming-marketplace";

export const marketplaceTool = ai.defineTool(
	{
		name: "marketplaceSearch",
		description: "Search for agricultural products like tractors, fertilizers, seeds, and pesticides with detailed information about prices, sellers, and availability",
		inputSchema: z.object({
			query: z.string().describe("Natural language query about agricultural products (e.g., 'I need a tractor', 'Show me urea fertilizer prices', 'Find Mahindra tractors in Maharashtra')"),
		}),
		outputSchema: z.object({
			success: z.boolean(),
			response: z.string().describe("Natural language response with product information"),
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
			totalResults: z.number().optional(),
		}),
	},
	async (input) => {
		try {
			// Extract search parameters from natural language query
			const query = input.query.toLowerCase();
			
			let productType = "";
			let productName = "";
			let location = "";
			let budget = "";
			let requirements = "";
			
			// Extract product type
			if (query.includes("tractor") || query.includes("farm equipment")) {
				productType = "tractor";
			} else if (query.includes("fertilizer") || query.includes("urea") || query.includes("nutrient")) {
				productType = "fertilizer";
			} else if (query.includes("seed") || query.includes("planting")) {
				productType = "seeds";
			} else if (query.includes("pesticide") || query.includes("insecticide") || query.includes("fungicide")) {
				productType = "pesticides";
			} else if (query.includes("tool") || query.includes("implement")) {
				productType = "tools";
			}
			
			// Extract product name/brand
			const brands = ["mahindra", "john deere", "new holland", "bharat", "nagarjuna", "shakti", "pioneer", "mahyco", "syngenta", "bayer", "upl"];
			for (const brand of brands) {
				if (query.includes(brand)) {
					productName = brand;
					break;
				}
			}
			
			// Extract location
			const states = ["maharashtra", "karnataka", "punjab", "haryana", "uttar pradesh", "tamil nadu", "kerala", "andhra pradesh"];
			for (const state of states) {
				if (query.includes(state)) {
					location = state;
					break;
				}
			}
			
			// Extract budget
			const budgetMatch = query.match(/₹?(\d+(?:,\d+)*(?:-\d+(?:,\d+)*)?)/);
			if (budgetMatch) {
				budget = budgetMatch[0];
			}
			
			// Extract requirements
			const reqs = [];
			if (query.includes("govt") || query.includes("government")) reqs.push("govt certified");
			if (query.includes("organic")) reqs.push("organic");
			if (query.includes("delivery")) reqs.push("delivery available");
			if (query.includes("stock") || query.includes("available")) reqs.push("in stock");
			requirements = reqs.join(", ");
			
			// If no product type found, default to tractors
			if (!productType) {
				productType = "tractor";
			}
			
			// Perform the search
			const searchInput: MarketplaceSearchInput = {
				productType,
				productName,
				location,
				budget,
				requirements,
			};
			
			const searchResult = await getMarketplaceSearch(searchInput);
			
			// Format the response
			let response = `I found ${searchResult.totalResults || searchResult.products?.length || 0} products for your search.\n\n`;
			
			if (searchResult.overview) {
				response += `${searchResult.overview}\n\n`;
			}
			
			if (searchResult.products && searchResult.products.length > 0) {
				response += "**Available Products:**\n\n";
				searchResult.products.forEach((product, index) => {
					response += `**${index + 1}. ${product.productName}**\n`;
					response += `• Brand: ${product.brand} ${product.model}\n`;
					response += `• Price: ${product.price}\n`;
					response += `• Seller: ${product.sellerName} (${product.sellerType})\n`;
					response += `• Stock: ${product.stockAvailability}\n`;
					response += `• Certification: ${product.certification}\n`;
					response += `• Delivery: ${product.deliveryOptions}\n`;
					response += `• Rating: ${product.rating}\n`;
					response += `• Contact: ${product.contactInfo}\n`;
					response += `• Action: ${product.action}\n\n`;
				});
			}
			
			if (searchResult.marketInsights) {
				response += `**Market Insights:**\n${searchResult.marketInsights}\n\n`;
			}
			
			return {
				success: true,
				response,
				products: searchResult.products,
				totalResults: searchResult.totalResults,
			};
		} catch (error) {
			return {
				success: false,
				response: `Sorry, I couldn't search for products right now. Please try again or visit our marketplace page for more options. Error: ${error instanceof Error ? error.message : "Unknown error"}`,
			};
		}
	},
); 