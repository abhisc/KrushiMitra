"use server";
/**
 * @fileOverview A crop disease diagnosis AI agent.
 *
 * - diagnoseCropDisease - A function that handles the crop disease diagnosis process.
 * - DiagnoseCropDiseaseInput - The input type for the diagnoseCropDisease function.
 * - DiagnoseCropDiseaseOutput - The return type for the diagnoseCropDisease function.
 */

import { ai } from "@/ai/genkit";
import { z } from "zod";

const DiagnoseCropDiseaseInputSchema = z.object({
	photoDataUri: z
		.string()
		.optional()
		.describe(
			"A photo of a crop, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'.",
		),
	description: z
		.string()
		.optional()
		.describe("The description of the crop symptoms."),
});
export type DiagnoseCropDiseaseInput = z.infer<
	typeof DiagnoseCropDiseaseInputSchema
>;

const DiagnoseCropDiseaseOutputSchema = z.object({
	disease: z.string().describe("The identified disease, if any."),
	confidence: z
		.number()
		.describe("The confidence level of the diagnosis (0-1)."),
	symptoms: z.string().describe("Detailed symptoms observed on the plant."),
	cause: z
		.string()
		.describe(
			"The causative agent of the disease and favorable conditions for its spread.",
		),
	diseaseCycle: z
		.string()
		.describe("Brief explanation of how the disease spreads and survives."),
	management: z
		.object({
			cultural: z.string().describe("Cultural and physical control methods."),
			chemical: z
				.string()
				.describe("Recommended fungicides or pesticides with usage notes."),
			biological: z
				.string()
				.describe("Biological control methods or biopesticides, if available."),
		})
		.describe("Management strategies for the disease."),
	resistantVarieties: z
		.string()
		.describe("Recommended disease-resistant crop varieties, if known."),
});
export type DiagnoseCropDiseaseOutput = z.infer<
	typeof DiagnoseCropDiseaseOutputSchema
>;

export async function diagnoseCropDisease(
	input: DiagnoseCropDiseaseInput,
): Promise<DiagnoseCropDiseaseOutput> {
	return diagnoseCropDiseaseFlow(input);
}

// Remove the inline prompt definition and use the dotprompt file
// import the ai instance as before

// Replace the inline prompt with the prompt loaded from the .prompt file
const prompt = ai.prompt("diagnose-crop-disease");

const diagnoseCropDiseaseFlow = ai.defineFlow(
	{
		name: "diagnoseCropDiseaseFlow",
		inputSchema: DiagnoseCropDiseaseInputSchema,
		outputSchema: DiagnoseCropDiseaseOutputSchema,
	},
	async (input) => {
		const { output } = await prompt(input);
		return output!;
	},
);
