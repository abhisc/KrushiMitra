import { genkit, Genkit, z } from "genkit";
import { googleAI } from "@genkit-ai/googleai";
import { createMcpServer } from "@genkit-ai/mcp";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

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
		model: "googleai/gemini-2.5-flash",
	});

	return aiInstance;
}

export const mcpServer = () => {
	const ais = getAiInstance();

	ais.defineTool(
		{
			name: "add",
			description: "add two numbers together",
			inputSchema: z.object({ a: z.number(), b: z.number() }),
			outputSchema: z.number(),
		},
		async ({ a, b }) => {
			return a + b;
		},
	);

	const server = createMcpServer(ais, {
		name: "example_server",
		version: "0.0.1",
	});

	server.setup().then(async () => {
		await server.start();
		const transport = new StdioServerTransport();
		await server!.server?.connect(transport);
	});
	return server;
};

export const ai = getAiInstance();
