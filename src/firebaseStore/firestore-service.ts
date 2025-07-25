import { db } from "./firebase";
import {
	doc,
	setDoc,
	getDoc,
	updateDoc,
	collection,
	getDocs,
	query,
	where,
	orderBy,
	limit,
	deleteDoc,
} from "firebase/firestore";

export interface BaseDocument {
	id?: string;
	createdAt?: Date;
	updatedAt?: Date;
}

export enum DBCollectionKeys {
	Users = "users",
	WeatherData = "weather_data",
	GovernmentScheme = "government_schemes",
	UserNotification = "user_notifications",
}

export class FirestoreService<T extends BaseDocument> {
	private collectionName: DBCollectionKeys;

	constructor(collectionName: DBCollectionKeys) {
		if (!Object.values(DBCollectionKeys).includes(collectionName)) {
			throw new Error(
				`Invalid collection name: ${collectionName}. Must be one of ${Object.values(DBCollectionKeys).join(", ")}.`,
			);
		}

		this.collectionName = collectionName;
	}

	// Utility function to remove undefined values from an object
	private removeUndefinedValues(obj: any): any {
		const cleaned: any = {};
		for (const [key, value] of Object.entries(obj)) {
			if (value !== undefined) {
				if (
					typeof value === "object" &&
					value !== null &&
					!Array.isArray(value)
				) {
					const cleanedNested = this.removeUndefinedValues(value);
					if (Object.keys(cleanedNested).length > 0) {
						cleaned[key] = cleanedNested;
					}
				} else {
					cleaned[key] = value;
				}
			}
		}
		return cleaned;
	}

	// Create a new document
	async create(id: string, data: Partial<T>): Promise<void> {
		try {
			const docRef = doc(db, this.collectionName, id);
			const now = new Date();

			const cleanedData = this.removeUndefinedValues({
				...data,
				id,
				createdAt: now,
				updatedAt: now,
			});

			await setDoc(docRef, cleanedData);
		} catch (error) {
			console.error(
				`Error creating document in ${this.collectionName}:`,
				error,
			);
			throw error;
		}
	}

	// Create a document only if it doesn't exist
	async createIfNotExists(id: string, data: Partial<T>): Promise<void> {
		try {
			const docRef = doc(db, this.collectionName, id);
			const existingDoc = await getDoc(docRef);

			if (existingDoc.exists()) {
				// Document already exists, don't overwrite it
				return;
			}

			await this.create(id, data);
		} catch (error) {
			console.error(
				`Error creating document if not exists in ${this.collectionName}:`,
				error,
			);
			throw error;
		}
	}

	// Get a document by ID
	async get(id: string): Promise<T | null> {
		try {
			const docRef = doc(db, this.collectionName, id);
			const docSnap = await getDoc(docRef);

			if (docSnap.exists()) {
				return docSnap.data() as T;
			}
			return null;
		} catch (error) {
			console.error(
				`Error getting document from ${this.collectionName}:`,
				error,
			);
			throw error;
		}
	}

	// Get or create a document (ensures it exists)
	async getOrCreate(id: string, defaultData: Partial<T>): Promise<T> {
		try {
			const docRef = doc(db, this.collectionName, id);
			const now = new Date();

			// Check if document already exists
			const existingDoc = await getDoc(docRef);
			if (existingDoc.exists()) {
				return existingDoc.data() as T;
			}

			// Create new document
			const cleanedData = this.removeUndefinedValues({
				...defaultData,
				id,
				createdAt: now,
				updatedAt: now,
			});

			await setDoc(docRef, cleanedData);

			// Return the newly created document
			const newDoc = await getDoc(docRef);
			return newDoc.data() as T;
		} catch (error) {
			console.error(
				`Error getting or creating document in ${this.collectionName}:`,
				error,
			);
			throw error;
		}
	}

	// Update a document
	async update(id: string, data: Partial<T>): Promise<void> {
		try {
			const docRef = doc(db, this.collectionName, id);
			const now = new Date();

			const cleanedData = this.removeUndefinedValues({
				...data,
				updatedAt: now,
			});

			await updateDoc(docRef, cleanedData);
		} catch (error) {
			console.error(
				`Error updating document in ${this.collectionName}:`,
				error,
			);
			throw error;
		}
	}

	// Update or create a document (upsert)
	async upsert(id: string, data: Partial<T>): Promise<void> {
		try {
			const docRef = doc(db, this.collectionName, id);
			const now = new Date();

			const cleanedData = this.removeUndefinedValues({
				...data,
				id,
				updatedAt: now,
			});

			await setDoc(docRef, cleanedData, { merge: true });
		} catch (error) {
			console.error(
				`Error upserting document in ${this.collectionName}:`,
				error,
			);
			throw error;
		}
	}

	// Delete a document
	async delete(id: string): Promise<void> {
		try {
			const docRef = doc(db, this.collectionName, id);
			await deleteDoc(docRef);
		} catch (error) {
			console.error(
				`Error deleting document from ${this.collectionName}:`,
				error,
			);
			throw error;
		}
	}

	// Get all documents in the collection
	async getAll(): Promise<T[]> {
		try {
			const querySnapshot = await getDocs(collection(db, this.collectionName));
			return querySnapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data(),
			})) as T[];
		} catch (error) {
			console.error(
				`Error getting all documents from ${this.collectionName}:`,
				error,
			);
			throw error;
		}
	}

	// Get documents with filters
	async getWhere(field: string, operator: any, value: any): Promise<T[]> {
		try {
			const q = query(
				collection(db, this.collectionName),
				where(field, operator, value),
			);
			const querySnapshot = await getDocs(q);
			return querySnapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data(),
			})) as T[];
		} catch (error) {
			console.error(
				`Error getting documents with filter from ${this.collectionName}:`,
				error,
			);
			throw error;
		}
	}

	// Get documents with ordering
	async getOrdered(
		field: string,
		direction: "asc" | "desc" = "asc",
		limitCount?: number,
	): Promise<T[]> {
		try {
			let q = query(
				collection(db, this.collectionName),
				orderBy(field, direction),
			);
			if (limitCount) {
				q = query(q, limit(limitCount));
			}
			const querySnapshot = await getDocs(q);
			return querySnapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data(),
			})) as T[];
		} catch (error) {
			console.error(
				`Error getting ordered documents from ${this.collectionName}:`,
				error,
			);
			throw error;
		}
	}
}
