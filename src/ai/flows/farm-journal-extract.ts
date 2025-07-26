import { ai } from "@/ai/genkit";
import { z } from 'zod';

// Super-structural schema: rawText, type, date, createdAt
export const FarmJournalEntrySchema = z.object({
  rawText: z.string().describe('The original user input.'),
  type: z.string().describe('Category/classification for the entry. Must be one of: land preparation, sowing, crop management, irrigation, fertilizer, pest control, weather, harvest, post-harvest, sales, finance, equipment, other.'),
  date: z.string().describe('ISO date string. If user provides a date, use it. If not, use today.'),
  createdAt: z.string().describe('ISO timestamp when the entry was created.'),
});

export type FarmJournalEntry = z.infer<typeof FarmJournalEntrySchema>;

// Super AI prompt for classification and date extraction
const farmJournalSuperPrompt = ai.definePrompt({
  name: "farmJournalSuperPrompt",
  input: { schema: z.object({ rawText: z.string() }) },
  output: { schema: FarmJournalEntrySchema.omit({ createdAt: true, date: true }) },
  prompt: `Analyze the following farm journal entry and classify it into the most relevant type.

Input: {{rawText}}`
});

export const farmJournalExtractFlow = ai.defineFlow(
  {
    name: 'farmJournalExtractFlow',
    inputSchema: z.object({ rawText: z.string() }),
    outputSchema: FarmJournalEntrySchema,
  },
  async ({ rawText }: { rawText: string }) => {
    const { output } = await farmJournalSuperPrompt({ rawText });
    
    // Fallback for date if not set by AI
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const createdAt = now.toISOString();
    
    return {
      rawText,
      type: output?.type?.toLowerCase().trim() || 'other',
      date,
      createdAt,
    };
  }
);

export async function runExtractFarmJournalEntry(rawText: string) {
  return farmJournalExtractFlow({ rawText });
} 