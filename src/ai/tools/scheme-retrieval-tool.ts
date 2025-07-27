import { SchemeService, SchemeInformation } from "@/firebaseStore/services/scheme-service";

export interface SchemeRetrievalParams {
	limit?: number;
	category?: string;
	state?: string;
}

export class SchemeRetrievalTool {
	private schemeService: SchemeService;

	constructor() {
		this.schemeService = new SchemeService();
	}

	/**
	 * Retrieve all schemes from Firestore
	 */
	async getAllSchemes(params?: SchemeRetrievalParams): Promise<SchemeInformation[]> {
		try {
			let schemes: SchemeInformation[] = [];

			if (params?.category) {
				schemes = await this.schemeService.getSchemesByCategory(params.category);
			} else if (params?.state) {
				schemes = await this.schemeService.getSchemesByState(params.state);
			} else {
				schemes = await this.schemeService.getAllSchemes();
			}

			// Apply limit if specified
			if (params?.limit && schemes.length > params.limit) {
				schemes = schemes.slice(0, params.limit);
			}

			return schemes;
		} catch (error) {
			console.error("Error retrieving schemes:", error);
			throw new Error(`Failed to retrieve schemes: ${error}`);
		}
	}

	/**
	 * Get scheme by ID
	 */
	async getSchemeById(schemeId: string): Promise<SchemeInformation | null> {
		try {
			return await this.schemeService.get(schemeId);
		} catch (error) {
			console.error("Error retrieving scheme by ID:", error);
			throw new Error(`Failed to retrieve scheme: ${error}`);
		}
	}

	/**
	 * Get schemes by category
	 */
	async getSchemesByCategory(category: string): Promise<SchemeInformation[]> {
		try {
			return await this.schemeService.getSchemesByCategory(category);
		} catch (error) {
			console.error("Error retrieving schemes by category:", error);
			throw new Error(`Failed to retrieve schemes by category: ${error}`);
		}
	}

	/**
	 * Get schemes by state
	 */
	async getSchemesByState(state: string): Promise<SchemeInformation[]> {
		try {
			return await this.schemeService.getSchemesByState(state);
		} catch (error) {
			console.error("Error retrieving schemes by state:", error);
			throw new Error(`Failed to retrieve schemes by state: ${error}`);
		}
	}

	/**
	 * Get scheme statistics
	 */
	async getSchemeStatistics(): Promise<{
		totalSchemes: number;
		categories: Record<string, number>;
		states: Record<string, number>;
	}> {
		try {
			const allSchemes = await this.schemeService.getAllSchemes();
			
			const categories: Record<string, number> = {};
			const states: Record<string, number> = {};

			allSchemes.forEach(scheme => {
				// Count categories
				scheme.schemeCategory.forEach(category => {
					categories[category] = (categories[category] || 0) + 1;
				});

				// Count states
				scheme.beneficiaryState.forEach(state => {
					states[state] = (states[state] || 0) + 1;
				});
			});

			return {
				totalSchemes: allSchemes.length,
				categories,
				states
			};
		} catch (error) {
			console.error("Error getting scheme statistics:", error);
			throw new Error(`Failed to get scheme statistics: ${error}`);
		}
	}
} 