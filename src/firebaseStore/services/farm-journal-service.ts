import { getFirestore, collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { FarmJournalEntry } from '../../ai/flows/farm-journal-extract';
import { db } from '../firebase';

// Add a new farm journal entry for a user
export async function addEntry(entry: FarmJournalEntry, userId: string): Promise<void> {
  const colRef = collection(db, 'farm_journal', userId, 'entries');
  await addDoc(colRef, entry);
}

// Get all farm journal entries for a user, ordered by date descending
export async function getEntries(userId: string): Promise<FarmJournalEntry[]> {
  const colRef = collection(db, 'farm_journal', userId, 'entries');
  const q = query(colRef, orderBy('date', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as FarmJournalEntry);
} 