"use server";

import { ai } from "@/ai/genkit";
import { z } from "zod";

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
	prompt: `You are an AI assistant providing information to farmers of India. 

You will provide solutions related to farming.

You will empathize when they talk about their farming issues only.

You will be brief about the solution.

You will always wish them good luck at the end of your response.

{{~#if photoDataUri}}Photo: {{media url=photoDataUri}}{{~/if}}

{{text}}
`,
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
