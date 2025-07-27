import { z } from "zod";
import { ai } from "../genkit";
import { fetchDataFromGovtAPI } from "@/helpers/govtData/fetchGovtData";
import { govtResources, ResourcesEnum } from "@/helpers/govtData/resources";
import stateNames from "@/constants/stateNames";

export const fetchDistrictsTool = ai.defineTool(
	{
		name: "fetchDistricts",
		description: "Fetch districts for a given state from government API",
		inputSchema: z.object({
			state: z
				.string()
				.describe(
					`Name of the state to fetch districts in ${JSON.stringify(stateNames)}`,
				),
		}),
		outputSchema: z.array(z.string()).describe("Array of district names"),
	},
	async (input) => {
		try {
			const data = await fetchDataFromGovtAPI(ResourcesEnum.districts, {
				format: "json",
				limit: "100",
				offset: "0",
				"filters[State]": input.state,
				...(govtResources["districts"].queryDefault || {}),
			});
			console.log("Fetched districts data:");

			const districts = (data?.records || [])?.reduce(
				(acc: string[], item: any) => {
					if (!acc.includes(item.District)) {
						acc.push(item.District);
					}
					return acc;
				},
				[],
			);

			return districts;
		} catch (error) {
			console.error("Error fetching districts:", error);
			throw new Error(`Failed to fetch districts for state: ${input.state}`);
		}
	},
);
