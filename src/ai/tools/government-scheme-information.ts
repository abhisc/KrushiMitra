"use server";

/**
 * @fileOverview A flow to provide farmers with information about relevant government schemes and subsidies.
 *
 * - getGovernmentSchemeInfo - A function that handles the retrieval of government scheme information.
 * - GovernmentSchemeInfoInput - The input type for the getGovernmentSchemeInfo function.
 * - GovernmentSchemeInfoOutput - The return type for the getGovernmentSchemeInfo function.
 * - getFarmerSchemes - A tool to fetch government schemes specifically for farmers from MyScheme API.
 */

import { ai } from "@/ai/genkit";
import { z } from "zod";
import { schemeService } from "@/firebaseStore/services";

const GovernmentSchemeInfoInputSchema = z.object({
	cropType: z.string().describe("The type of crop the farmer is growing."),
	location: z
		.string()
		.describe("The location of the farmer (e.g., state, district)."),
	farmSize: z.string().describe("The size of the farm in acres."),
	query: z
		.string()
		.optional()
		.describe("Optional: specific question about government schemes."),
});
export type GovernmentSchemeInfoInput = z.infer<
	typeof GovernmentSchemeInfoInputSchema
>;

const GovernmentSchemeInfoOutputSchema = z.object({
	schemes: z
		.array(
			z.object({
				name: z.string().describe("The name of the government scheme."),
				description: z.string().describe("A brief description of the scheme."),
				eligibility: z
					.string()
					.describe("The eligibility criteria for the scheme."),
				benefits: z.string().describe("The benefits offered under the scheme."),
				howToApply: z
					.string()
					.describe("Instructions on how to apply for the scheme."),
			}),
		)
		.describe("A list of relevant government schemes and subsidies."),
});
export type GovernmentSchemeInfoOutput = z.infer<
	typeof GovernmentSchemeInfoOutputSchema
>;

export async function getGovernmentSchemeInfo(
	input: GovernmentSchemeInfoInput,
): Promise<GovernmentSchemeInfoOutput> {
	try {
		// First try to get schemes from API/database
		const searchQuery = `${input.cropType} ${input.location} ${input.farmSize} ${input.query || ''}`.trim();
		const apiSchemes = await schemeService.searchSchemes(searchQuery);

		if (apiSchemes.length > 0) {
			// Transform API schemes to output format
			const schemes = apiSchemes.map((scheme) => ({
				name: scheme.schemeName,
				description: scheme.briefDescription,
				eligibility: `Category: ${scheme.schemeCategory.join(', ')} | For: ${scheme.schemeFor}`,
				benefits: `Ministry: ${scheme.nodalMinistryName} | States: ${scheme.beneficiaryState.join(', ')}`,
				howToApply: `Please visit the official website for ${scheme.schemeName} for application details.`,
			}));

			return { schemes };
		}

		// If no API results, fallback to AI
		return governmentSchemeInfoFlow(input);
	} catch (error) {
		console.error("Error in getGovernmentSchemeInfo:", error);
		// Fallback to AI if there's an error
		return governmentSchemeInfoFlow(input);
	}
}

const prompt = ai.definePrompt({
	name: "governmentSchemeInfoPrompt",
	input: { schema: GovernmentSchemeInfoInputSchema },
	output: { schema: GovernmentSchemeInfoOutputSchema },
	prompt: `You are an AI assistant providing information about government schemes and subsidies to farmers in India.\n\nYou have access to a database of government schemes. Based on the farmer's crop type, location, and farm size, identify relevant schemes and provide details about each scheme, with eligibility and how to apply.\n\nCrop Type: {{cropType}}\nLocation: {{location}}\nFarm Size: {{farmSize}}\n\n{{#if query}}\nFarmer's Question: {{query}}\n{{/if}}\n\nProvide the information in a structured format as described in the output schema.\n`,
});

const governmentSchemeInfoFlow = ai.defineFlow(
	{
		name: "governmentSchemeInfoFlow",
		inputSchema: GovernmentSchemeInfoInputSchema,
		outputSchema: GovernmentSchemeInfoOutputSchema,
	},
	async (input) => {
		const { output } = await prompt(input);
		return output!;
	},
);

// New tool for fetching farmer schemes from MyScheme API
const FarmerSchemeSearchInputSchema = z.object({
	occupation: z
		.string()
		.default("Farmer")
		.describe("Occupation of the person (default: Farmer)"),
	residence: z
		.string()
		.optional()
		.describe("Residence type: Rural, Urban, or Both"),
	state: z
		.string()
		.optional()
		.describe("State of residence (e.g., Karnataka, Maharashtra)"),
	age: z.number().optional().describe("Age of the person"),
	gender: z.string().optional().describe("Gender: Male, Female, or All"),
	isStudent: z.string().optional().describe("Student status: Yes or No"),
	disability: z.string().optional().describe("Disability status: Yes or No"),
	minority: z.string().optional().describe("Minority status: Yes or No"),
	caste: z.string().optional().describe("Caste: General, OBC, SC, ST, or All"),
	familyIncomeAnnual: z.number().optional().describe("Annual family income"),
	keyword: z.string().optional().describe("Optional search keyword"),
	from: z.number().optional().describe("Pagination offset (default: 0)"),
	size: z
		.number()
		.optional()
		.describe("Number of results per page (default: 10)"),
});

const FarmerSchemeSearchOutputSchema = z.object({
	schemes: z
		.array(
			z.object({
				id: z.string().describe("Scheme ID"),
				name: z.string().describe("Scheme name"),
				description: z.string().describe("Scheme description"),
				category: z.string().optional().describe("Scheme category"),
				benefits: z.string().optional().describe("Benefits offered"),
				eligibility: z.string().optional().describe("Eligibility criteria"),
				howToApply: z.string().optional().describe("How to apply"),
				state: z.string().optional().describe("Applicable state"),
				lastUpdated: z.string().optional().describe("Last updated date"),
			}),
		)
		.describe("List of government schemes for farmers"),
	totalResults: z.number().describe("Total number of schemes found"),
	searchParams: z
		.object({
			filters: z.array(z.any()).describe("Applied search filters"),
			keyword: z.string().optional().describe("Search keyword used"),
		})
		.describe("Search parameters used"),
});

export type FarmerSchemeSearchInput = z.infer<
	typeof FarmerSchemeSearchInputSchema
>;
export type FarmerSchemeSearchOutput = z.infer<
	typeof FarmerSchemeSearchOutputSchema
>;

// Tool to fetch government schemes for farmers from MyScheme API
export const getFarmerSchemes = ai.defineTool(
	{
		name: "getFarmerSchemes",
		description:
			"Fetch government schemes specifically for farmers from the MyScheme API",
		inputSchema: FarmerSchemeSearchInputSchema,
		outputSchema: FarmerSchemeSearchOutputSchema,
	},
	async (input) => {
		try {
			// Build search parameters
			const searchParams: any = {
				userProfile: {
					occupation: input.occupation,
					residence: input.residence || "Rural",
					state: input.state,
					age: input.age,
					gender: input.gender || "All",
					isStudent: input.isStudent || "No",
					disability: input.disability || "No",
					minority: input.minority || "No",
					caste: input.caste || "All",
					familyIncomeAnnual: input.familyIncomeAnnual,
				},
				query: input.keyword,
			};

			// Create search query from parameters
			const searchQuery = [
				input.occupation,
				input.residence || "Rural",
				input.state,
				input.keyword,
				"farmer",
				"agriculture",
				"scheme"
			].filter(Boolean).join(" ");

			// Fetch schemes from database
			const apiSchemes = await schemeService.searchSchemes(searchQuery);

			// Transform the schemes to match output schema
			const schemes = apiSchemes.map((scheme: any) => ({
				id: scheme.schemeId || scheme.id || `scheme_${Date.now()}`,
				name: scheme.schemeName || "Unknown Scheme",
				description: scheme.briefDescription || "No description available",
				category: scheme.schemeCategory?.join(", ") || "Agriculture",
				benefits: `Ministry: ${scheme.nodalMinistryName} | States: ${scheme.beneficiaryState?.join(", ")}`,
				eligibility: `Category: ${scheme.schemeCategory?.join(", ")} | For: ${scheme.schemeFor}`,
				howToApply: `Please visit the official website for ${scheme.schemeName} for application process`,
				state: input.state,
				lastUpdated: scheme.updatedAt?.toISOString() || new Date().toISOString(),
			}));

			// Create filters array from search parameters
			const filters = Object.entries(searchParams.userProfile)
				.filter(([_, value]) => value !== undefined && value !== null)
				.map(([key, value]) => `${key}: ${value}`);

			return {
				schemes,
				totalResults: schemes.length,
				searchParams: {
					filters,
					keyword: input.keyword,
				},
			};
		} catch (error) {
			console.error("Error fetching farmer schemes:", error);
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error occurred";
			throw new Error(`Failed to fetch government schemes: ${errorMessage}`);
		}
	},
);
