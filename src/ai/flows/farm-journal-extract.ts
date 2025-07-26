import { ai } from "@/ai/genkit";
import { z } from 'zod';

// Super-structural schema: rawText, type, date, createdAt
export const FarmJournalEntrySchema = z.object({
  rawText: z.string().describe('The original user input.'),
  type: z.string().describe('Highly specific category/classification for the entry, e.g., Fertilizer, Crop Activity, Weather, Pesticide, Watering, Harvest, Sowing, Other.'),
  date: z.string().describe('ISO date string. If user provides a date, use it. If not, use today.'),
  createdAt: z.string().describe('ISO timestamp when the entry was created.'),
});

export type FarmJournalEntry = z.infer<typeof FarmJournalEntrySchema>;

// Super AI prompt for classification and date extraction
const farmJournalSuperPrompt = ai.definePrompt({
  name: "farmJournalSuperPrompt",
  input: { schema: z.object({ rawText: z.string() }) },
  output: { schema: FarmJournalEntrySchema.omit({ createdAt: true }) },
  prompt: `Classify the following farm journal entry into a highly specific type. Use one of: Fertilizer, Crop Activity, Weather, Pesticide, Watering, Harvest, Sowing, Other. Also extract the date (ISO format, YYYY-MM-DD): if the user provides a date, use it; if not, use today's date. Only return the original rawText, the type, and the date.

Input: {{rawText}}

Respond in JSON format: { "rawText": ..., "type": ..., "date": ... }`
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
    let date = output?.date || new Date().toISOString().slice(0, 10);
    let createdAt = new Date().toISOString();
    return {
      rawText,
      type: output?.type || 'Other',
      date,
      createdAt,
    };
  }
);

export async function runExtractFarmJournalEntry(rawText: string) {
  return farmJournalExtractFlow({ rawText });
} 