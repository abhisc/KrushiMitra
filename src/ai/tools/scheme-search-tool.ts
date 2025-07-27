import { SchemeService, SchemeInformation } from "@/firebaseStore/services/scheme-service";

export interface SchemeSearchParams {
	query: string;
	category?: string;
	state?: string;
	level?: string;
	schemeFor?: string;
	limit?: number;
	exactMatch?: boolean;
}

export interface SchemeSearchResult {
	schemes: SchemeInformation[];
	totalFound: number;
	searchParams: SchemeSearchParams;
}

export class SchemeSearchTool {
	private schemeService: SchemeService;

	constructor() {
		this.schemeService = new SchemeService();
	}

	/**
	 * Search schemes by text query
	 */
	async searchSchemes(params: SchemeSearchParams): Promise<SchemeSearchResult> {
		try {
			// Get all schemes first (for client-side search)
			let schemes = await this.schemeService.getAllSchemes();

			// Apply filters
			schemes = this.applyFilters(schemes, params);

			// Apply text search
			const searchResults = this.performTextSearch(schemes, params.query, params.exactMatch);

			// Apply limit
			if (params.limit && searchResults.length > params.limit) {
				searchResults.schemes = searchResults.schemes.slice(0, params.limit);
			}

			return {
				schemes: searchResults.schemes,
				totalFound: searchResults.totalFound,
				searchParams: params
			};
		} catch (error) {
			console.error("Error searching schemes:", error);
			throw new Error(`Failed to search schemes: ${error}`);
		}
	}

	/**
	 * Search schemes by multiple criteria
	 */
	async advancedSearch(params: {
		keywords?: string[];
		categories?: string[];
		states?: string[];
		levels?: string[];
		schemeFor?: string[];
		limit?: number;
	}): Promise<SchemeSearchResult> {
		try {
			let schemes = await this.schemeService.getAllSchemes();

			// Filter by categories
			if (params.categories && params.categories.length > 0) {
				schemes = schemes.filter(scheme =>
					params.categories!.some(category =>
						scheme.schemeCategory.some(schemeCategory =>
							schemeCategory.toLowerCase().includes(category.toLowerCase())
						)
					)
				);
			}

			// Filter by states
			if (params.states && params.states.length > 0) {
				schemes = schemes.filter(scheme =>
					params.states!.some(state =>
						scheme.beneficiaryState.some(schemeState =>
							schemeState.toLowerCase().includes(state.toLowerCase())
						)
					)
				);
			}

			// Filter by levels
			if (params.levels && params.levels.length > 0) {
				schemes = schemes.filter(scheme =>
					params.levels!.some(level =>
						scheme.level.toLowerCase().includes(level.toLowerCase())
					)
				);
			}

			// Filter by schemeFor
			if (params.schemeFor && params.schemeFor.length > 0) {
				schemes = schemes.filter(scheme =>
					params.schemeFor!.some(target =>
						scheme.schemeFor.toLowerCase().includes(target.toLowerCase())
					)
				);
			}

			// Apply keyword search
			if (params.keywords && params.keywords.length > 0) {
				const keywordResults = this.performKeywordSearch(schemes, params.keywords);
				schemes = keywordResults.schemes;
			}

			// Apply limit
			if (params.limit && schemes.length > params.limit) {
				schemes = schemes.slice(0, params.limit);
			}

			return {
				schemes,
				totalFound: schemes.length,
				searchParams: { query: params.keywords?.join(" ") || "" }
			};
		} catch (error) {
			console.error("Error performing advanced search:", error);
			throw new Error(`Failed to perform advanced search: ${error}`);
		}
	}

	/**
	 * Search schemes for a specific user profile
	 */
	async searchSchemesForUser(userProfile: {
		location?: { state?: string };
		caste?: string;
		residence?: string;
		gender?: string;
		age?: number;
	}, limit?: number): Promise<SchemeSearchResult> {
		try {
			let schemes = await this.schemeService.getAllSchemes();

			// Filter based on user location
			if (userProfile.location?.state) {
				schemes = schemes.filter(scheme =>
					scheme.beneficiaryState.includes("All") ||
					scheme.beneficiaryState.some(state =>
						state.toLowerCase().includes(userProfile.location!.state!.toLowerCase())
					)
				);
			}

			// Filter based on user characteristics
			const userFilters: string[] = [];
			if (userProfile.caste) userFilters.push(userProfile.caste);
			if (userProfile.residence) userFilters.push(userProfile.residence);
			if (userProfile.gender) userFilters.push(userProfile.gender);

			if (userFilters.length > 0) {
				schemes = schemes.filter(scheme =>
					scheme.tags.some(tag =>
						userFilters.some(filter =>
							tag.toLowerCase().includes(filter.toLowerCase())
						)
					)
				);
			}

			// Apply limit
			if (limit && schemes.length > limit) {
				schemes = schemes.slice(0, limit);
			}

			return {
				schemes,
				totalFound: schemes.length,
				searchParams: { query: "user profile based search" }
			};
		} catch (error) {
			console.error("Error searching schemes for user:", error);
			throw new Error(`Failed to search schemes for user: ${error}`);
		}
	}

	/**
	 * Get search suggestions based on partial input
	 */
	async getSearchSuggestions(partialQuery: string, limit: number = 10): Promise<string[]> {
		try {
			const schemes = await this.schemeService.getAllSchemes();
			const suggestions = new Set<string>();

			const queryLower = partialQuery.toLowerCase();

			schemes.forEach(scheme => {
				// Add scheme names that match
				if (scheme.schemeName.toLowerCase().includes(queryLower)) {
					suggestions.add(scheme.schemeName);
				}

				// Add categories that match
				scheme.schemeCategory.forEach(category => {
					if (category.toLowerCase().includes(queryLower)) {
						suggestions.add(category);
					}
				});

				// Add tags that match
				scheme.tags.forEach(tag => {
					if (tag.toLowerCase().includes(queryLower)) {
						suggestions.add(tag);
					}
				});
			});

			return Array.from(suggestions).slice(0, limit);
		} catch (error) {
			console.error("Error getting search suggestions:", error);
			return [];
		}
	}

	private applyFilters(schemes: SchemeInformation[], params: SchemeSearchParams): SchemeInformation[] {
		let filtered = schemes;

		if (params.category) {
			filtered = filtered.filter(scheme =>
				scheme.schemeCategory.some(cat =>
					cat.toLowerCase().includes(params.category!.toLowerCase())
				)
			);
		}

		if (params.state) {
			filtered = filtered.filter(scheme =>
				scheme.beneficiaryState.some(state =>
					state.toLowerCase().includes(params.state!.toLowerCase())
				)
			);
		}

		if (params.level) {
			filtered = filtered.filter(scheme =>
				scheme.level.toLowerCase().includes(params.level!.toLowerCase())
			);
		}

		if (params.schemeFor) {
			filtered = filtered.filter(scheme =>
				scheme.schemeFor.toLowerCase().includes(params.schemeFor!.toLowerCase())
			);
		}

		return filtered;
	}

	private performTextSearch(schemes: SchemeInformation[], query: string, exactMatch?: boolean): { schemes: SchemeInformation[]; totalFound: number } {
		const queryLower = query.toLowerCase();
		const keywords = queryLower.split(" ").filter(word => word.length > 2);

		const results = schemes.filter(scheme => {
			const searchText = `${scheme.schemeName} ${scheme.briefDescription} ${scheme.tags.join(" ")} ${scheme.schemeCategory.join(" ")}`.toLowerCase();

			if (exactMatch) {
				return searchText.includes(queryLower);
			} else {
				return keywords.some(keyword => searchText.includes(keyword));
			}
		});

		return {
			schemes: results,
			totalFound: results.length
		};
	}

	private performKeywordSearch(schemes: SchemeInformation[], keywords: string[]): { schemes: SchemeInformation[]; totalFound: number } {
		const results = schemes.filter(scheme => {
			const searchText = `${scheme.schemeName} ${scheme.briefDescription} ${scheme.tags.join(" ")} ${scheme.schemeCategory.join(" ")}`.toLowerCase();
			
			return keywords.some(keyword =>
				searchText.includes(keyword.toLowerCase())
			);
		});

		return {
			schemes: results,
			totalFound: results.length
		};
	}
} 