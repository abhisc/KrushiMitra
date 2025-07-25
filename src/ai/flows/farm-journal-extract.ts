import { ai } from "@/ai/genkit";
import { z } from 'zod';

// Define the schema for the extracted entry
export const FarmJournalEntrySchema = z.object({
  date: z.date().describe("If user provides date, use it. If not, use today's date."), // ISO date
  type: z.string().describe('Category of the entry: [Fertilizer, Crop activity, Weather, Pestisidies, Others] .'),
  quantity: z.number().optional(),
  unit: z.string().optional(),
  rawText: z.string(),
});

export type FarmJournalEntry = z.infer<typeof FarmJournalEntrySchema>;

// Helper to parse 'today' and natural dates
function parseDate(raw: string): string {
  const today = new Date();
  if (/today/i.test(raw)) {
    return today.toISOString().slice(0, 10);
  }
  // Try to parse other date formats (e.g., '25 july')
  const dateMatch = raw.match(/(\d{1,2})\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*|\d{4}-\d{2}-\d{2}/i);
  if (dateMatch) {
    const [_, day, month] = dateMatch;
    if (day && month) {
      const year = today.getFullYear();
      const date = new Date(`${year}-${month.slice(0,3)}-${day}`);
      return date.toISOString().slice(0, 10);
    }
    if (dateMatch[0].length === 10) return dateMatch[0];
  }
  return today.toISOString().slice(0, 10); // fallback
}

// Define the AI prompt for extraction
const farmJournalExtractPrompt = ai.definePrompt({
  name: "farmJournalExtractPrompt",
  input: { schema: z.object({ rawText: z.string() }) },
  output: { schema: FarmJournalEntrySchema },
  prompt: `Extract the following fields from the user's farm journal entry:
- date (ISO format, 'today' = current date)
- type (e.g., urea, water, fertilizer, crop activity, weather, etc.)
- quantity (number, if present)
- unit (e.g., gm, kg, liters, if present)
- rawText (the original input)

Input: {{rawText}}

Respond in JSON format matching the output schema.`
});

const farmJournalExtractFlow = ai.defineFlow(
  {
    name: 'farmJournalExtractFlow',
    inputSchema: z.object({ rawText: z.string() }),
    outputSchema: FarmJournalEntrySchema,
  },
  async ({ rawText }: { rawText: string }) => {
    const { output } = await farmJournalExtractPrompt({ rawText });
    // Fallbacks for date and type if not set by AI
    let date = output?.date ?? new Date();
    let type = output?.type || 'unknown';
    return {
      ...output,
      date,
      createdAt: new Date(),
      type,
      rawText,
    };
  }
);

export async function runExtractFarmJournalEntry(rawText: string) {
  return farmJournalExtractFlow({ rawText });
} 