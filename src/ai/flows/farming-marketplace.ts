"use server";
/**
 * @fileOverview Farming Marketplace platform for farmers to get detailed information, compare prices, and explore agricultural products.
 *
 * - getMarketplaceSearch - A function that searches for agricultural products and provides detailed information.
 * - MarketplaceSearchInput - The input type for the getMarketplaceSearch function.
 * - MarketplaceSearchOutput - The return type for the getMarketplaceSearch function.
 */

import { ai } from "@/ai/genkit";
import { z } from "zod";

const MarketplaceSearchInputSchema = z.object({
	productType: z
		.string()
		.describe("The type of product being searched (e.g., tractor, fertilizer, seeds, pesticides, tools)")
		.optional(),
	productName: z
		.string()
		.describe("The specific product name or brand being searched")
		.optional(),
	location: z
		.string()
		.describe("The location or state for searching products")
		.optional(),
	budget: z
		.string()
		.describe("Budget range or price preference")
		.optional(),
	requirements: z
		.string()
		.describe("Additional requirements or specifications")
		.optional(),
});

export type MarketplaceSearchInput = z.infer<typeof MarketplaceSearchInputSchema>;

const ProductSchema = z.object({
	productName: z.string().describe("Name of the product"),
	brand: z.string().describe("Brand of the product"),
	model: z.string().describe("Model number or variant"),
	price: z.string().describe("Price in Indian Rupees"),
	sellerType: z.string().describe("Type of seller (Krushi Kendra, Local Dealer, Authorized Distributor)"),
	sellerName: z.string().describe("Name of the seller"),
	stockAvailability: z.string().describe("Stock availability status"),
	certification: z.string().describe("Certification tags if applicable"),
	deliveryOptions: z.string().describe("Delivery options available"),
	rating: z.string().describe("Seller rating if available"),
	contactInfo: z.string().describe("Contact information for the seller"),
	action: z.string().describe("Recommended action (Buy, Call, Visit)"),
});

const MarketplaceSearchOutputSchema = z.object({
	searchQuery: z.string().describe("The search query that was processed"),
	overview: z.string().describe("Overview of the search results and market conditions"),
	products: z.array(ProductSchema).describe("List of available products with details"),
	alternatives: z.array(ProductSchema).describe("Alternative products if main search yields no results"),
	marketInsights: z.string().describe("Market insights and recommendations"),
	totalResults: z.number().describe("Total number of products found"),
});

export type MarketplaceSearchOutput = z.infer<typeof MarketplaceSearchOutputSchema>;

export async function getMarketplaceSearch(
	input: MarketplaceSearchInput,
): Promise<MarketplaceSearchOutput> {
	return marketplaceSearchFlow(input);
}

// Tool for fetching product data from various sources
export const fetchProductDataTool = ai.defineTool(
	{
		name: "fetchProductData",
		description: "Fetch product data from various agricultural marketplaces and sellers",
		inputSchema: z.object({
			productType: z.string().describe("Type of product to search for"),
			location: z.string().describe("Location for the search"),
			budget: z.string().describe("Budget range"),
		}),
		outputSchema: z.object({
			success: z.boolean(),
			data: z.string().describe("Product data in structured format"),
			source: z.string().describe("Source of the data"),
		}),
	},
	async (input) => {
		// Simulate fetching data from various sources
		const mockData = generateMockProductData(input.productType, input.location, input.budget);
		return {
			success: true,
			data: mockData,
			source: "Agricultural Marketplace Database",
		};
	},
);

// Tool for fetching seller information
export const fetchSellerInfoTool = ai.defineTool(
	{
		name: "fetchSellerInfo",
		description: "Fetch detailed information about sellers and their ratings",
		inputSchema: z.object({
			sellerType: z.string().describe("Type of seller"),
			location: z.string().describe("Location of the seller"),
		}),
		outputSchema: z.object({
			success: z.boolean(),
			data: z.string().describe("Seller information"),
		}),
	},
	async (input) => {
		const mockSellerData = generateMockSellerData(input.sellerType, input.location);
		return {
			success: true,
			data: mockSellerData,
		};
	},
);

// Helper function to generate mock product data
function generateMockProductData(productType: string, location: string, budget: string): string {
	const tractorData = `
Tractor Model: Mahindra 265 DI
Brand: Mahindra
Price: ₹5,45,000
Seller Type: Krushi Kendra
Seller Name: Krushi Kendra - ${location}
Stock Availability: Available in stock
Certification: Govt-certified
Delivery Options: Delivery available
Rating: 4.8/5
Contact Info: 1800-XXX-XXXX
Action: Buy / Visit

Tractor Model: John Deere 5045D
Brand: John Deere
Price: ₹6,25,000
Seller Type: Local Dealer
Seller Name: AgroTech Solutions
Stock Availability: Limited stock
Certification: Authorized Distributor
Delivery Options: Pickup only
Rating: 4.5/5
Contact Info: +91-98765-43210
Action: Buy / Call

Tractor Model: New Holland 3630 TX
Brand: New Holland
Price: ₹5,85,000
Seller Type: Authorized Private Distributor
Seller Name: New Holland Dealership
Stock Availability: Available on request
Certification: Certified by Manufacturer
Delivery Options: Delivery available
Rating: 4.7/5
Contact Info: +91-98765-43211
Action: Buy / Call
`;

	const fertilizerData = `
Urea 50kg (Brand: Bharat Fertilizers)
Brand: Bharat Fertilizers
Price: ₹550
Seller Type: Krushi Kendra
Seller Name: Krushi Kendra - ${location}
Stock Availability: Available
Certification: Govt-certified
Delivery Options: Delivery available
Rating: 4.9/5
Contact Info: 1800-XXX-XXXX
Action: Buy / Visit

Urea 50kg (Brand: Nagarjuna)
Brand: Nagarjuna
Price: ₹600
Seller Type: Local Dealer
Seller Name: AgroChem Store
Stock Availability: Available in stock
Certification: Organic Certified
Delivery Options: Pickup only
Rating: 4.7/5
Contact Info: +91-98765-43212
Action: Buy / Call

Urea 50kg (Brand: Shakti Chemicals)
Brand: Shakti Chemicals
Price: ₹570
Seller Type: Authorized Distributor
Seller Name: Shakti Agro Solutions
Stock Availability: Limited stock
Certification: Govt-approved
Delivery Options: Delivery available
Rating: 4.6/5
Contact Info: +91-98765-43213
Action: Buy / Visit
`;

	const seedData = `
Hybrid Corn Seeds (Brand: Pioneer)
Brand: Pioneer
Price: ₹1,200 per kg
Seller Type: Krushi Kendra
Seller Name: Krushi Kendra - ${location}
Stock Availability: Available
Certification: Govt-certified
Delivery Options: Delivery available
Rating: 4.8/5
Contact Info: 1800-XXX-XXXX
Action: Buy / Visit

Wheat Seeds (Brand: Mahyco)
Brand: Mahyco
Price: ₹450 per kg
Seller Type: Local Dealer
Seller Name: Seed Solutions
Stock Availability: Available in stock
Certification: Certified Seeds
Delivery Options: Pickup only
Rating: 4.5/5
Contact Info: +91-98765-43214
Action: Buy / Call

Paddy Seeds (Brand: Syngenta)
Brand: Syngenta
Price: ₹380 per kg
Seller Type: Authorized Distributor
Seller Name: Syngenta Agro
Stock Availability: Limited stock
Certification: Govt-approved
Delivery Options: Delivery available
Rating: 4.7/5
Contact Info: +91-98765-43215
Action: Buy / Visit
`;

	const pesticideData = `
Insecticide - Imidacloprid (Brand: Bayer)
Brand: Bayer
Price: ₹850 per liter
Seller Type: Krushi Kendra
Seller Name: Krushi Kendra - ${location}
Stock Availability: Available
Certification: Govt-certified
Delivery Options: Delivery available
Rating: 4.8/5
Contact Info: 1800-XXX-XXXX
Action: Buy / Visit

Fungicide - Mancozeb (Brand: UPL)
Brand: UPL
Price: ₹650 per kg
Seller Type: Local Dealer
Seller Name: CropCare Solutions
Stock Availability: Available in stock
Certification: Organic Certified
Delivery Options: Pickup only
Rating: 4.6/5
Contact Info: +91-98765-43216
Action: Buy / Call

Herbicide - Glyphosate (Brand: Syngenta)
Brand: Syngenta
Price: ₹720 per liter
Seller Type: Authorized Distributor
Seller Name: Syngenta Agro
Stock Availability: Limited stock
Certification: Govt-approved
Delivery Options: Delivery available
Rating: 4.7/5
Contact Info: +91-98765-43217
Action: Buy / Visit
`;

	switch (productType.toLowerCase()) {
		case "tractor":
		case "tractors":
			return tractorData;
		case "fertilizer":
		case "fertilizers":
		case "urea":
			return fertilizerData;
		case "seed":
		case "seeds":
			return seedData;
		case "pesticide":
		case "pesticides":
		case "insecticide":
		case "fungicide":
		case "herbicide":
			return pesticideData;
		default:
			return tractorData; // Default to tractors
	}
}

// Helper function to generate mock seller data
function generateMockSellerData(sellerType: string, location: string): string {
	const krushiKendraData = `
Seller Type: Krushi Kendra
Name: Krushi Kendra - ${location}
Rating: 4.8/5
Certification: Govt-certified
Services: Fertilizers, Seeds, Pesticides, Tools
Contact: 1800-XXX-XXXX
Address: Main Market, ${location}
Operating Hours: 9 AM - 6 PM
Payment Methods: Cash, UPI, Bank Transfer
`;

	const localDealerData = `
Seller Type: Local Dealer
Name: AgroTech Solutions
Rating: 4.5/5
Certification: Authorized Distributor
Services: Tractors, Implements, Spare Parts
Contact: +91-98765-43210
Address: Industrial Area, ${location}
Operating Hours: 8 AM - 8 PM
Payment Methods: Cash, UPI, EMI Available
`;

	const authorizedDistributorData = `
Seller Type: Authorized Distributor
Name: New Holland Dealership
Rating: 4.7/5
Certification: Certified by Manufacturer
Services: Tractors, Farm Equipment, Service
Contact: +91-98765-43211
Address: Highway Road, ${location}
Operating Hours: 9 AM - 7 PM
Payment Methods: Cash, UPI, EMI, Bank Finance
`;

	switch (sellerType.toLowerCase()) {
		case "krushi kendra":
		case "government":
			return krushiKendraData;
		case "local dealer":
		case "dealer":
			return localDealerData;
		case "authorized distributor":
		case "distributor":
			return authorizedDistributorData;
		default:
			return krushiKendraData;
	}
}

const prompt = ai.definePrompt({
	name: "marketplaceSearchPrompt",
	input: {
		schema: MarketplaceSearchInputSchema.extend({
			productData: z.string().describe("Product data from various sources"),
			sellerData: z.string().describe("Seller information and ratings"),
		}),
	},
	output: { schema: MarketplaceSearchOutputSchema },
	prompt: `You are an AI assistant for a Farming Marketplace platform. Your role is to help farmers find detailed information about agricultural products, compare prices, and explore various sellers.

Instructions:
1. Analyze the user's search query and identify the product type, location, and requirements.
2. Search through available product data and provide comprehensive information.
3. Include all relevant details: price, brand, model, seller information, stock availability, certifications, delivery options, and ratings.
4. If the exact product is not available, suggest alternatives.
5. Provide market insights and recommendations.

Product Information to Include:
- Product Name and Brand
- Model/Variant
- Price in Indian Rupees
- Seller Type (Krushi Kendra, Local Dealer, Authorized Distributor)
- Seller Name and Rating
- Stock Availability
- Certifications (Govt-certified, Organic, etc.)
- Delivery Options
- Contact Information
- Recommended Action

Search Query: {{{productType}}} {{{productName}}} {{{location}}} {{{budget}}} {{{requirements}}}
Product Data: {{{productData}}}
Seller Data: {{{sellerData}}}

Provide a comprehensive marketplace search result with detailed product comparisons and actionable recommendations.`,
});

const marketplaceSearchFlow = ai.defineFlow(
	{
		name: "marketplaceSearchFlow",
		inputSchema: MarketplaceSearchInputSchema,
		outputSchema: MarketplaceSearchOutputSchema,
	},
	async (input) => {
		// Fetch product data
		const productDataResult = await fetchProductDataTool({
			productType: input.productType || "tractor",
			location: input.location || "India",
			budget: input.budget || "",
		});

		// Fetch seller information
		const sellerDataResult = await fetchSellerInfoTool({
			sellerType: "Krushi Kendra",
			location: input.location || "India",
		});

		const { output } = await prompt({
			...input,
			productData: productDataResult.data,
			sellerData: sellerDataResult.data,
		});

		return output!;
	},
); 