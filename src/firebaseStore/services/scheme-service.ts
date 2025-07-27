import { FirestoreService, DBCollectionKeys } from "../firestore-service";

export interface SchemeInformation {
	id?: string;
	schemeId: string;
	schemeName: string;
	schemeShortTitle?: string;
	briefDescription: string;
	schemeCategory: string[];
	beneficiaryState: string[];
	level: string;
	schemeFor: string;
	nodalMinistryName: string;
	tags: string[];
	slug: string;
	createdAt?: Date;
	updatedAt?: Date;
}

export class SchemeService extends FirestoreService<SchemeInformation> {
	constructor() {
		super(DBCollectionKeys.SchemesInformation);
	}

	/**
	 * Store multiple schemes in Firestore, only if they don't already exist
	 */
	async storeSchemesIfNotExist(schemes: SchemeInformation[]): Promise<void> {
		try {
			const promises = schemes.map(async (scheme) => {
				// Use the scheme ID as the document ID
				const documentId = scheme.schemeId || scheme.id || scheme.slug;
				if (!documentId) {
					console.warn("Scheme missing ID, skipping:", scheme);
					return;
				}

				// Check if scheme already exists
				const existingScheme = await this.get(documentId);
				if (!existingScheme) {
					// Store the scheme if it doesn't exist
					await this.create(documentId, scheme);
					console.log(`Stored new scheme: ${scheme.schemeName}`);
				} else {
					console.log(`Scheme already exists: ${scheme.schemeName}`);
				}
			});

			await Promise.all(promises);
		} catch (error) {
			console.error("Error storing schemes:", error);
			throw error;
		}
	}

	/**
	 * Get all stored schemes
	 */
	async getAllSchemes(): Promise<SchemeInformation[]> {
		return this.getAll();
	}

	/**
	 * Get schemes by category
	 */
	async getSchemesByCategory(category: string): Promise<SchemeInformation[]> {
		return this.getWhere("schemeCategory", "array-contains", category);
	}

	/**
	 * Get schemes by state
	 */
	async getSchemesByState(state: string): Promise<SchemeInformation[]> {
		return this.getWhere("beneficiaryState", "array-contains", state);
	}

	/**
	 * Search schemes by name or description
	 */
	async searchSchemes(searchTerm: string): Promise<SchemeInformation[]> {
		// Note: Firestore doesn't support full-text search natively
		// This is a simple implementation that gets all schemes and filters client-side
		// For production, consider using Algolia or similar search service
		const allSchemes = await this.getAll();
		const searchLower = searchTerm.toLowerCase();
		
		return allSchemes.filter(scheme => 
			scheme.schemeName.toLowerCase().includes(searchLower) ||
			scheme.briefDescription.toLowerCase().includes(searchLower) ||
			scheme.tags.some(tag => tag.toLowerCase().includes(searchLower))
		);
	}
}
