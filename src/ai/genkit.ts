import { genkit, Genkit } from "genkit";
import { googleAI } from "@genkit-ai/googleai";

// Get API key from environment or use the provided one
const apiKey =
	process.env.GOOGLE_API_KEY ||
	process.env.GEMINI_API_KEY ||
	"AIzaSyCZzIYIgA1K4aaUxM3X67hgDtaUfBWrpZY";

let aiInstance: Genkit | null = null;

function getAiInstance(): Genkit {
	if (aiInstance) {
		return aiInstance;
	}

	if (!apiKey) {
		throw new Error("Google AI API key is required");
	}

	aiInstance = genkit({
		plugins: [
			googleAI({
				apiKey: apiKey,
			}),
		],
		model: "googleai/gemini-2.5-pro",
	});

	return aiInstance;
}

export const ai = getAiInstance();
