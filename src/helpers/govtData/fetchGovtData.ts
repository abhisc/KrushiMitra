import dayjs from "dayjs";
import { govtResources } from "./resources";

export async function fetchDataFromGovtAPI(
	resourceKey: keyof typeof govtResources,
	queryParams: Record<string, string | undefined>,
	limit = "50",
	numberOfDays = 5,
) {
	const resource = govtResources[resourceKey];
	if (!resource) {
		throw new Error(`Resource ${resourceKey} not found`);
	}

	const baseUrl = `https://api.data.gov.in${resource.url}`;
	const allRecords: any[] = [];

	// Calculate dates for last n days
	const today = new Date();
	const dates: string[] = [];

	for (let i = 1; i <= numberOfDays; i++) {
		const date = new Date(today);
		date.setDate(today.getDate() - i);
		dates.push(dayjs(date).format("DD-MM-YYYY"));
	}

	try {
		// Filter out null/undefined values from queryParams
		const filteredParams = Object.fromEntries(
			Object.entries(queryParams).filter(([_, value]) => !!value),
		);

		// Fetch data for each of the last n days
		const fetchPromises = dates.map(async (date) => {
			const queryString = new URLSearchParams({
				...filteredParams,
				format: "json",
				limit,
				"filters[Arrival_Date]": date, // Add date filter
			}).toString();
			const apiUrl = `${baseUrl}?${queryString}&api-key=579b464db66ec23bdd0000010a0b007fd4fc40b34482a6c41d1447d7}`;

			try {
				const { response } = await fetch(
					`https://krushimitraproxy-537443643233.europe-west1.run.app/govtApis?apiUrl=${apiUrl}`,
					{
						body: JSON.stringify({ apiUrl }),
						headers: { "Content-Type": "application/json" },
						method: "POST",
					},
				).then((res) => res.json());

				return response.records || [];
			} catch (error) {
				console.warn(`Error fetching data for ${date}:`, error);
				return [];
			}
		});

		// Wait for all queries to complete
		const results = await Promise.all(fetchPromises);
		// Combine results from all days
		results.forEach((records, index) => {
			if (records.length > 0) {
				// Add date information to each record for tracking
				const recordsWithDate = records.map((record: any) => ({
					...record,
					fetchDate: dates[index],
				}));
				allRecords.push(...recordsWithDate);
			}
		});
	} catch (error) {
		if (error instanceof Error) {
			console.warn(`Error fetching data:`, error.message);
		} else {
			console.warn(`Error fetching data:`, error);
		}
	}

	return { records: allRecords };
}
