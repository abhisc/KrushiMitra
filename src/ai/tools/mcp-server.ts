import { createMcpServer } from "@genkit-ai/mcp";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ai } from "../genkit";

(async () => {
	try {
		console.log("Starting AI server...");
		const server = createMcpServer(ai, {
			name: "example_server",
			version: "0.0.1",
		});
		// Setup (async) then starts with stdio transport by default
		server.setup().then(async () => {
			console.log(await server.start());
			const transport = new StdioServerTransport();
			await server!.server?.connect(transport);
			console.log("Server started and connected to stdio transport");
		});
	} catch (error) {
		console.error("Error starting AI server:", error);
	}
})();
