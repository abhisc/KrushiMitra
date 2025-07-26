import {
	FirestoreService,
	BaseDocument,
	DBCollectionKeys,
} from "./firestore-service";
import { SchemeService } from "./services/scheme-service";
import {
	PlantationFlowService,
	PlantationFlowData,
} from "./services/plantation-flow-service";

// Example interfaces for different collections
export interface WeatherData extends BaseDocument {
	userId: string;
	city: string;
	state: string;
	temperature: number;
	humidity: number;
	description: string;
	timestamp: Date;
}

export interface GovernmentScheme extends BaseDocument {
	title: string;
	description: string;
	eligibility: {
		isStudent?: boolean;
		minority?: boolean;
		disability?: boolean;
		caste?: string[];
		residence?: string[];
		ageRange?: {
			min: number;
			max: number;
		};
		gender?: string[];
	};
	benefits: string[];
	applicationUrl?: string;
	isActive: boolean;
}

export interface UserNotification extends BaseDocument {
	userId: string;
	title: string;
	message: string;
	type: "info" | "warning" | "success" | "error";
	isRead: boolean;
	relatedSchemeId?: string;
}

// Service classes for different collections
export class WeatherService extends FirestoreService<WeatherData> {
	constructor() {
		super(DBCollectionKeys.WeatherData);
	}

	// Custom method for weather data
	async getWeatherByUser(userId: string): Promise<WeatherData[]> {
		return this.getWhere("userId", "==", userId);
	}

	async getLatestWeatherByUser(userId: string): Promise<WeatherData | null> {
		const weatherData = await this.getOrdered("timestamp", "desc", 1);
		return weatherData.length > 0 ? weatherData[0] : null;
	}
}

export class GovernmentSchemeService extends FirestoreService<GovernmentScheme> {
	constructor() {
		super(DBCollectionKeys.GovernmentScheme);
	}

	// Custom method for active schemes
	async getActiveSchemes(): Promise<GovernmentScheme[]> {
		return this.getWhere("isActive", "==", true);
	}

	// Custom method for schemes by eligibility
	async getSchemesByEligibility(
		criteria: Partial<GovernmentScheme["eligibility"]>,
	): Promise<GovernmentScheme[]> {
		const activeSchemes = await this.getActiveSchemes();

		return activeSchemes.filter((scheme) => {
			const eligibility = scheme.eligibility;

			// Check each criteria
			if (
				criteria.isStudent !== undefined &&
				eligibility.isStudent !== criteria.isStudent
			) {
				return false;
			}
			if (
				criteria.minority !== undefined &&
				eligibility.minority !== criteria.minority
			) {
				return false;
			}
			if (
				criteria.disability !== undefined &&
				eligibility.disability !== criteria.disability
			) {
				return false;
			}
			if (
				criteria.caste &&
				eligibility.caste &&
				!eligibility.caste.includes(criteria.caste[0])
			) {
				return false;
			}
			if (
				criteria.residence &&
				eligibility.residence &&
				!eligibility.residence.includes(criteria.residence[0])
			) {
				return false;
			}
			if (
				criteria.gender &&
				eligibility.gender &&
				!eligibility.gender.includes(criteria.gender[0])
			) {
				return false;
			}

			return true;
		});
	}
}

export class NotificationService extends FirestoreService<UserNotification> {
	constructor() {
		super(DBCollectionKeys.UserNotification);
	}

	// Custom method for user notifications
	async getUserNotifications(userId: string): Promise<UserNotification[]> {
		return this.getWhere("userId", "==", userId);
	}

	// Custom method for unread notifications
	async getUnreadNotifications(userId: string): Promise<UserNotification[]> {
		const notifications = await this.getUserNotifications(userId);
		return notifications.filter((notification) => !notification.isRead);
	}

	// Custom method to mark notification as read
	async markAsRead(notificationId: string): Promise<void> {
		await this.update(notificationId, { isRead: true });
	}

	// Custom method to mark all notifications as read
	async markAllAsRead(userId: string): Promise<void> {
		const unreadNotifications = await this.getUnreadNotifications(userId);
		const updatePromises = unreadNotifications.map((notification) =>
			this.update(notification.id!, { isRead: true }),
		);
		await Promise.all(updatePromises);
	}
}

// Export singleton instances for easy use
export const weatherService = new WeatherService();
export const governmentSchemeService = new GovernmentSchemeService();
export const notificationService = new NotificationService();
export const schemeService = new SchemeService();
export const plantationFlowService = new PlantationFlowService();
