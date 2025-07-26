import {
	FirestoreService,
	BaseDocument,
	DBCollectionKeys,
} from "../firestore-service";

export interface UserProfile extends BaseDocument {
	uid: string;
	displayName?: string | null;
	email?: string | null;
	photoURL?: string | null;
	// Additional user details
	isStudent?: "Yes" | "No";
	minority?: "Yes" | "No";
	disability?: "Yes" | "No";
	caste?: "All" | "General" | "SC" | "ST" | "OBC";
	residence?: "Both" | "Urban" | "Rural";
	age?: number;
	gender?: "All" | "Male" | "Female" | "Other";
	location?: {
		city?: string;
		state?: string;
		coordinates?: {
			latitude: number;
			longitude: number;
		};
	};
}

export class UserService extends FirestoreService<UserProfile> {
	constructor() {
		super(DBCollectionKeys.Users);
	}

	// Override create to use uid as the document ID
	async createUserProfile(userData: Partial<UserProfile>): Promise<void> {
		return this.createIfNotExists(userData.uid!, userData);
	}

	// Override get to use uid as the document ID
	async getUserProfile(uid: string): Promise<UserProfile | null> {
		return this.get(uid);
	}

	// Override getOrCreate to use uid as the document ID
	async ensureUserProfile(
		userData: Partial<UserProfile>,
	): Promise<UserProfile | null> {
		try {
			return await this.getOrCreate(userData.uid!, userData);
		} catch (error) {
			console.error("Error ensuring user profile:", error);
			throw error;
		}
	}

	// Override update to use uid as the document ID
	async updateUserProfile(
		uid: string,
		userData: Partial<UserProfile>,
	): Promise<void> {
		return this.update(uid, userData);
	}

	// Special method for updating additional info with fallback
	async updateAdditionalInfo(
		uid: string,
		additionalInfo: Partial<UserProfile>,
		userDisplayName?: string,
	): Promise<void> {
		try {
			// First, ensure the user profile exists
			const existingProfile = await this.get(uid);
			if (!existingProfile) {
				// Create a basic profile first with actual user display name
				await this.create(uid, {
					uid,
					displayName: userDisplayName || "Anonymous User",
				});
			}

			// Update with additional info
			await this.update(uid, additionalInfo);
		} catch (error) {
			console.error("Error updating additional info:", error);

			// If update fails, try upsert as fallback
			try {
				await this.upsert(uid, {
					...additionalInfo,
					displayName: userDisplayName || "Anonymous User",
				});
			} catch (setError) {
				console.error(
					"Error creating/updating user profile with upsert:",
					setError,
				);
				throw setError;
			}
		}
	}
}
