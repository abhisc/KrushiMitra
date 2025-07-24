import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/googleai";

// Get API key from environment or use the provided one
const apiKey =
	process.env.GOOGLE_API_KEY ||
	process.env.GEMINI_API_KEY ||
	"AIzaSyCZzIYIgA1K4aaUxM3X67hgDtaUfBWrpZY";

export const ai = genkit({
	plugins: [
		googleAI({
			apiKey: apiKey,
		}),
	],
	model: "googleai/gemini-2.0-flash",
});
