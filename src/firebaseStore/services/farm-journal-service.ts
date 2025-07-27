import { collection, addDoc, getDocs } from "firebase/firestore";
import { FarmJournalEntry } from "../../ai/flows/farm-journal-extract";
import { db } from "../firebase";

// Add a new farm journal entry for a user (rawText, type, date, createdAt)
export async function addEntry(
	entry: FarmJournalEntry,
	userId: string,
): Promise<void> {
	const colRef = collection(db, "farm_journal", userId, "entries");
	// Only save rawText, type, date, and createdAt
	await addDoc(colRef, {
		rawText: entry.rawText,
		type: entry.type,
		date: entry.date,
		createdAt: entry.createdAt,
	});
}

// Get all farm journal entries for a user
export async function getEntries(userId: string): Promise<FarmJournalEntry[]> {
	const colRef = collection(db, "farm_journal", userId, "entries");
	const snapshot = await getDocs(colRef);
	return snapshot.docs.map((doc) => doc.data() as FarmJournalEntry);
}
