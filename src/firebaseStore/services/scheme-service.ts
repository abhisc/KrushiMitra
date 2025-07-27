import {
	FirestoreService,
	BaseDocument,
	DBCollectionKeys,
} from "../firestore-service";

export interface GovernmentScheme extends BaseDocument {
	schemeId: string;
	name: string;
	description: string;
	eligibility: string;
	benefits: string;
	howToApply: string;
	category: string;
	state?: string;
	cropType?: string;
	farmSize?: string;
	apiData?: any; // Store original API response
	lastUpdated: Date;
}

export interface SchemeSearchParams {
	cropType?: string;
	location?: string;
	farmSize?: string;
	query?: string;
	userProfile?: any;
}

export class SchemeService extends FirestoreService<GovernmentScheme> {
	constructor() {
		super(DBCollectionKeys.Schemes);
	}

	// Search schemes from external API
	async searchSchemesFromAPI(params: SchemeSearchParams): Promise<any[]> {
		try {
			// Build query parameters for the API
			const queryParams = this.buildQueryParams(params);

			const response = await fetch(
				`https://api.myscheme.gov.in/search/v5/schemes?lang=en&q=${encodeURIComponent(JSON.stringify(queryParams))}&keyword=${encodeURIComponent(params.query || "")}&sort=&from=0&size=20`,
				{
					headers: {
						accept: "application/json, text/plain, */*",
						"accept-language": "en-US,en;q=0.9,kn;q=0.8",
						"cache-control": "no-cache",
						pragma: "no-cache",
						priority: "u=1, i",
						"sec-ch-ua":
							'"Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"',
						"sec-ch-ua-mobile": "?0",
						"sec-ch-ua-platform": '"Windows"',
						"sec-fetch-dest": "empty",
						"sec-fetch-mode": "cors",
						"sec-fetch-site": "same-site",
						"x-api-key": "tYTy5eEhlu9rFjyxuCr7ra7ACp4dv1RH8gWuHTDc",
					},
					method: "GET",
					mode: "cors",
					credentials: "omit",
				},
			);

			if (!response.ok) {
				throw new Error(`API request failed: ${response.status}`);
			}

			const data = await response.json();
			return data.schemes || [];
		} catch (error) {
			console.error("Error fetching schemes from API:", error);
			throw error;
		}
	}

	// Build query parameters based on user profile and search criteria
	public buildQueryParams(params: SchemeSearchParams): any[] {
		const queryParams: any[] = [
			{ identifier: "isStudent", value: "No" },
			{ identifier: "minority", value: "No" },
			{ identifier: "disability", value: "No" },
			{ identifier: "caste", value: "All" },
			{ identifier: "caste", value: "General" },
			{ identifier: "residence", value: "Both" },
			{ identifier: "residence", value: "Rural" },
			{ identifier: "gender", value: "All" },
			{ identifier: "gender", value: "Male" },
		];

		// Add age range for farmers (typically 18-65)
		queryParams.push({
			identifier: "age-general",
			min: "18",
			max: "65",
		});

		// If user profile exists, use their specific information
		if (params.userProfile) {
			const profile = params.userProfile;

			if (profile.isStudent) {
				queryParams.push({ identifier: "isStudent", value: profile.isStudent });
			}

			if (profile.minority) {
				queryParams.push({ identifier: "minority", value: profile.minority });
			}

			if (profile.disability) {
				queryParams.push({
					identifier: "disability",
					value: profile.disability,
				});
			}

			if (profile.caste) {
				queryParams.push({ identifier: "caste", value: profile.caste });
			}

			if (profile.residence) {
				queryParams.push({ identifier: "residence", value: profile.residence });
			}

			if (profile.gender) {
				queryParams.push({ identifier: "gender", value: profile.gender });
			}

			if (profile.age) {
				queryParams.push({
					identifier: "age-general",
					min: profile.age.toString(),
					max: profile.age.toString(),
				});
			}
		}

		return queryParams;
	}

	// Transform API scheme data to our format
	transformSchemeData(
		apiScheme: any,
		params: SchemeSearchParams,
	): GovernmentScheme {
		return {
			schemeId: apiScheme.id || apiScheme.schemeId || `scheme_${Date.now()}`,
			name: apiScheme.name || apiScheme.title || "Unknown Scheme",
			description:
				apiScheme.description ||
				apiScheme.summary ||
				"No description available",
			eligibility:
				apiScheme.eligibility ||
				"Please check official website for eligibility criteria",
			benefits:
				apiScheme.benefits ||
				apiScheme.amount ||
				"Benefits vary based on scheme",
			howToApply:
				apiScheme.howToApply ||
				apiScheme.applicationProcess ||
				"Please visit official website for application process",
			category: apiScheme.category || "Agriculture",
			state: params.location,
			cropType: params.cropType,
			farmSize: params.farmSize,
			apiData: apiScheme,
			lastUpdated: new Date(),
			createdAt: new Date(),
			updatedAt: new Date(),
		};
	}

	// Save scheme to Firestore
	async saveScheme(scheme: GovernmentScheme): Promise<void> {
		try {
			await this.create(scheme.schemeId, scheme);
		} catch (error) {
			console.error("Error saving scheme:", error);
			throw error;
		}
	}

	// Get schemes by criteria
	async getSchemesByCriteria(
		criteria: Partial<GovernmentScheme>,
	): Promise<GovernmentScheme[]> {
		try {
			const allSchemes = await this.getAll();

			// Filter schemes based on criteria
			return allSchemes.filter((scheme) => {
				for (const [key, value] of Object.entries(criteria)) {
					if (
						value !== undefined &&
						scheme[key as keyof GovernmentScheme] !== value
					) {
						return false;
					}
				}
				return true;
			});
		} catch (error) {
			console.error("Error getting schemes by criteria:", error);
			throw error;
		}
	}

	// Search schemes with fallback to AI if API fails
	async searchSchemes(params: SchemeSearchParams): Promise<GovernmentScheme[]> {
		try {
			// First try to get from API
			const apiSchemes = await this.searchSchemesFromAPI(params);

			if (apiSchemes.length > 0) {
				// Transform and save to Firestore
				const transformedSchemes = apiSchemes.map((scheme) =>
					this.transformSchemeData(scheme, params),
				);

				// Save to Firestore for caching
				for (const scheme of transformedSchemes) {
					await this.saveScheme(scheme);
				}

				return transformedSchemes;
			}

			// If no API results, return empty array (AI fallback will be handled in the flow)
			return [];
		} catch (error) {
			console.error("Error searching schemes:", error);
			// Return empty array to trigger AI fallback
			return [];
		}
	}
}
