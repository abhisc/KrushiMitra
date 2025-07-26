import type { NextApiRequest, NextApiResponse } from 'next';
import { runExtractFarmJournalEntry } from '@/ai/flows/farm-journal-extract';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const { rawText } = req.body;
    if (!rawText || typeof rawText !== 'string') {
      res.status(400).json({ error: 'Missing or invalid rawText' });
      return;
    }
    const result = await runExtractFarmJournalEntry(rawText);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to extract farm journal entry', details: (err as Error).message });
  }
} 