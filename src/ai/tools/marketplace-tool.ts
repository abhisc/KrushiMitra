import { ai } from "@/ai/genkit";
import { z } from "zod";
import { getMarketplaceSearch, MarketplaceSearchInput } from "@/ai/flows/farming-marketplace";

export const marketplaceTool = ai.defineTool(
	{
		name: "marketplaceSearch",
		description: "Search for agricultural products like tractors, fertilizers, seeds, and pesticides with detailed information about prices, sellers, and availability",
		inputSchema: z.object({
			query: z.string().describe("Natural language query about agricultural products (e.g., 'I need a tractor', 'Show me urea fertilizer prices', 'Find Mahindra tractors in Maharashtra', 'Looking for organic seeds under 5000 rupees', 'Best fertilizers for wheat farming', 'Compare tractor prices')"),
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
			let cropSpecific = "";
			let comparisonMode = false;
			
			// Check for comparison queries
			if (query.includes("compare") || query.includes("comparison") || query.includes("vs") || query.includes("versus")) {
				comparisonMode = true;
			}
			
			// Enhanced product type extraction with synonyms
			const productSynonyms = {
				tractor: ["tractor", "farm equipment", "farm machinery", "agricultural machinery", "farm vehicle"],
				fertilizer: ["fertilizer", "fertiliser", "urea", "nutrient", "npk", "dap", "manure", "plant food", "soil nutrient"],
				seeds: ["seed", "seeds", "planting", "crop seed", "grain", "sapling", "seedling"],
				pesticides: ["pesticide", "insecticide", "fungicide", "herbicide", "weedicide", "crop protection", "plant protection"],
				tools: ["tool", "implement", "plough", "harrow", "cultivator", "planter", "sprayer", "farm tool"],
				irrigation: ["irrigation", "sprinkler", "drip", "water system", "watering", "pump", "pipe"],
				harvesters: ["harvester", "combine", "thresher", "harvesting machine", "crop harvester"],
				storage: ["storage", "silo", "warehouse", "grain storage", "storage facility"],
				livestock: ["livestock", "animal feed", "cattle", "poultry", "dairy", "veterinary"]
			};
			
			// Find product type using synonyms
			for (const [type, synonyms] of Object.entries(productSynonyms)) {
				if (synonyms.some(synonym => query.includes(synonym))) {
					productType = type;
					break;
				}
			}
			
			// Enhanced brand extraction with categories
			const brandCategories = {
				tractor: ["mahindra", "john deere", "new holland", "eicher", "swaraj", "massey ferguson", "kubota", "force", "preet"],
				fertilizer: ["nagarjuna", "shakti", "hindustan", "coromandel", "iocl", "kribhco", "nfl", "gsfc", "deepak", "chambal", "paras", "zuari"],
				seeds: ["pioneer", "mahyco", "syngenta", "bayer", "upl", "advanta", "nuziveedu", "kaveri", "ankur", "namdhari"],
				pesticides: ["bayer", "syngenta", "upl", "basf", "dow", "dupont", "fmc", "sumitomo", "adama", "gharda"]
			};
			
			// Extract brand based on product type context
			if (productType && brandCategories[productType as keyof typeof brandCategories]) {
				const relevantBrands = brandCategories[productType as keyof typeof brandCategories];
				for (const brand of relevantBrands) {
					if (query.includes(brand)) {
						productName = brand;
						break;
					}
				}
			}
			
			// If no brand found in specific category, check all brands
			if (!productName) {
				const allBrands = Object.values(brandCategories).flat();
				for (const brand of allBrands) {
					if (query.includes(brand)) {
						productName = brand;
						break;
					}
				}
			}
			
			// Enhanced location extraction with districts and cities
			const locations = {
				states: [
					"maharashtra", "karnataka", "punjab", "haryana", "uttar pradesh", "tamil nadu", 
					"kerala", "andhra pradesh", "telangana", "gujarat", "rajasthan", "madhya pradesh",
					"bihar", "west bengal", "odisha", "assam", "jharkhand", "chhattisgarh",
					"himachal pradesh", "uttarakhand", "jammu and kashmir", "delhi", "chandigarh"
				],
				cities: [
					"mumbai", "pune", "nashik", "aurangabad", "nagpur", "bangalore", "mysore", 
					"hubli", "mangalore", "delhi", "gurgaon", "faridabad", "ghaziabad",
					"chandigarh", "ludhiana", "amritsar", "jalandhar", "chennai", "coimbatore", 
					"madurai", "salem", "hyderabad", "vijayawada", "visakhapatnam",
					"kochi", "thiruvananthapuram", "calicut", "ahmedabad", "surat", "vadodara",
					"jaipur", "jodhpur", "bhopal", "indore", "patna", "ranchi", "kolkata", "bhubaneswar"
				]
			};
			
			// Check for states first, then cities
			for (const state of locations.states) {
				if (query.includes(state)) {
					location = state;
					break;
				}
			}
			
			if (!location) {
				for (const city of locations.cities) {
					if (query.includes(city)) {
						location = city;
						break;
					}
				}
			}
			
			// Enhanced budget extraction with multiple formats and currencies
			const budgetPatterns = [
				/₹?(\d+(?:,\d+)*(?:-\d+(?:,\d+)*)?)/,
				/(\d+(?:,\d+)*)\s*(?:to|-)\s*(\d+(?:,\d+)*)/,
				/under\s*₹?(\d+(?:,\d+)*)/,
				/above\s*₹?(\d+(?:,\d+)*)/,
				/between\s*₹?(\d+(?:,\d+)*)\s*and\s*₹?(\d+(?:,\d+)*)/,
				/rs\.?\s*(\d+(?:,\d+)*)/,
				/rupees?\s*(\d+(?:,\d+)*)/,
				/less\s*than\s*₹?(\d+(?:,\d+)*)/,
				/more\s*than\s*₹?(\d+(?:,\d+)*)/
			];
			
			for (const pattern of budgetPatterns) {
				const match = query.match(pattern);
				if (match) {
					if (match[2]) {
						budget = `₹${match[1]} - ₹${match[2]}`;
					} else {
						budget = match[0];
					}
					break;
				}
			}
			
			// Enhanced requirements extraction with more options
			const reqs = [];
			if (query.includes("govt") || query.includes("government") || query.includes("certified") || query.includes("approved")) reqs.push("govt certified");
			if (query.includes("organic") || query.includes("natural") || query.includes("bio")) reqs.push("organic");
			if (query.includes("delivery") || query.includes("shipping") || query.includes("transport")) reqs.push("delivery available");
			if (query.includes("stock") || query.includes("available") || query.includes("in stock") || query.includes("ready")) reqs.push("in stock");
			if (query.includes("warranty") || query.includes("guarantee") || query.includes("assurance")) reqs.push("warranty available");
			if (query.includes("financing") || query.includes("loan") || query.includes("emi") || query.includes("credit")) reqs.push("financing available");
			if (query.includes("used") || query.includes("second hand") || query.includes("pre-owned")) reqs.push("used products");
			if (query.includes("new") || query.includes("brand new") || query.includes("fresh")) reqs.push("new products");
			if (query.includes("discount") || query.includes("offer") || query.includes("deal")) reqs.push("discount available");
			if (query.includes("bulk") || query.includes("wholesale") || query.includes("large quantity")) reqs.push("bulk purchase");
			if (query.includes("urgent") || query.includes("immediate") || query.includes("asap")) reqs.push("urgent delivery");
			requirements = reqs.join(", ");
			
			// Crop-specific search extraction
			const crops = [
				"wheat", "rice", "maize", "cotton", "sugarcane", "potato", "tomato", "onion",
				"pulses", "oilseeds", "vegetables", "fruits", "spices", "tea", "coffee",
				"jowar", "bajra", "ragi", "mustard", "groundnut", "soybean", "sunflower"
			];
			
			for (const crop of crops) {
				if (query.includes(crop)) {
					cropSpecific = crop;
					break;
				}
			}
			
			// If no product type found, try to infer from context
			if (!productType) {
				if (query.includes("price") || query.includes("cost") || cropSpecific) {
					productType = "fertilizer"; // Most common for crop-specific queries
				} else if (query.includes("farm") || query.includes("agriculture") || query.includes("field")) {
					productType = "tractor";
				} else if (query.includes("plant") || query.includes("grow") || query.includes("cultivate")) {
					productType = "seeds";
				} else if (query.includes("protect") || query.includes("pest") || query.includes("disease")) {
					productType = "pesticides";
				} else {
					productType = "tractor"; // Default fallback
				}
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
			
			// Enhanced response formatting with context awareness
			let response = "";
			
			// Add crop-specific recommendations if applicable
			if (cropSpecific) {
				response += `Based on your search for ${cropSpecific}, here are the best options:\n\n`;
			}
			
			if (comparisonMode) {
				response += "Here's a comparison of available products:\n\n";
			} else if (searchResult.totalResults && searchResult.totalResults > 0) {
				response += `I found ${searchResult.totalResults} products matching your requirements.\n\n`;
			} else if (searchResult.products && searchResult.products.length > 0) {
				response += `I found ${searchResult.products.length} products for you.\n\n`;
			} else {
				response += "I couldn't find exact matches, but here are some related products:\n\n";
			}
			
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
			
			// Add seasonal recommendations
			const currentMonth = new Date().getMonth();
			const seasons = {
				"rabi": [10, 11, 0, 1, 2, 3], // Oct-Mar
				"kharif": [6, 7, 8, 9], // Jul-Oct
				"zaid": [3, 4, 5, 6] // Apr-Jul
			};
			
			let currentSeason = "";
			for (const [season, months] of Object.entries(seasons)) {
				if (months.includes(currentMonth)) {
					currentSeason = season;
					break;
				}
			}
			
			if (currentSeason && !cropSpecific) {
				response += `**Seasonal Tip:** It's currently ${currentSeason} season. Consider products suitable for ${currentSeason} crops.\n\n`;
			}
			
			// Add helpful suggestions if no results
			if ((!searchResult.products || searchResult.products.length === 0) && (!searchResult.totalResults || searchResult.totalResults === 0)) {
				response += "**Suggestions:**\n";
				response += "• Try broadening your search criteria\n";
				response += "• Check different locations or brands\n";
				response += "• Consider similar product categories\n";
				if (cropSpecific) {
					response += `• Look for ${cropSpecific}-specific products\n`;
				}
				response += "• Visit our marketplace page for more options\n\n";
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