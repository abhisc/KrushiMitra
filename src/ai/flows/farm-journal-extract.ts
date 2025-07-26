import { ai } from "@/ai/genkit";
import { z } from 'zod';

// Super-structural schema: rawText, type, date, createdAt
export const FarmJournalEntrySchema = z.object({
  rawText: z.string().describe('The original user input.'),
  type: z.string().describe('Category/classification for the entry. Must be one of: fertilizer, crop activity, water, weather, pesticide, harvest, sowing, other.'),
  date: z.string().describe('ISO date string. If user provides a date, use it. If not, use today.'),
  createdAt: z.string().describe('ISO timestamp when the entry was created.'),
});

export type FarmJournalEntry = z.infer<typeof FarmJournalEntrySchema>;

// Super AI prompt for classification and date extraction
const farmJournalSuperPrompt = ai.definePrompt({
  name: "farmJournalSuperPrompt",
  input: { schema: z.object({ rawText: z.string() }) },
  output: { schema: FarmJournalEntrySchema.omit({ createdAt: true }) },
  prompt: `Classify the following farm journal entry into a specific type. Use EXACTLY one of these lowercase types:

- "fertilizer" - for any fertilizer application, manure, soil amendments, NPK, urea, etc.
- "crop activity" - for planting, sowing, transplanting, pruning, weeding, crop management activities
- "water" - for irrigation, watering, flood, drought, water management
- "weather" - for rain, storm, temperature, climate conditions, weather events
- "pesticide" - for pest control, insecticide, fungicide, herbicide application
- "harvest" - for harvesting, crop collection, yield activities
- "sowing" - for seed sowing, seed treatment, germination activities
- "other" - for anything else not covered above

Also extract the date (ISO format, YYYY-MM-DD): if the user provides a date, use it; if not, use today's date.

Input: {{rawText}}

Respond in JSON format: { "rawText": "...", "type": "lowercase_type", "date": "YYYY-MM-DD" }`
});

export const farmJournalExtractFlow = ai.defineFlow(
  {
    name: 'farmJournalExtractFlow',
    inputSchema: z.object({ rawText: z.string() }),
    outputSchema: FarmJournalEntrySchema,
  },
  async ({ rawText }: { rawText: string }) => {
    const { output } = await farmJournalSuperPrompt({ rawText });
    
    // Normalize the type to ensure it matches frontend expectations
    let normalizedType = output?.type?.toLowerCase().trim() || 'other';
    
    // Map common variations to expected types
    const typeMapping: Record<string, string> = {
      'fertilizer': 'fertilizer',
      'fertilizers': 'fertilizer',
      'fertilization': 'fertilizer',
      'manure': 'fertilizer',
      'npk': 'fertilizer',
      'urea': 'fertilizer',
      
      'crop activity': 'crop activity',
      'crop activities': 'crop activity',
      'planting': 'crop activity',
      'transplanting': 'crop activity',
      'pruning': 'crop activity',
      'weeding': 'crop activity',
      'crop management': 'crop activity',
      
      'water': 'water',
      'irrigation': 'water',
      'watering': 'water',
      'flood': 'water',
      'drought': 'water',
      
      'weather': 'weather',
      'rain': 'weather',
      'storm': 'weather',
      'temperature': 'weather',
      'climate': 'weather',
      
      'pesticide': 'pesticide',
      'pest control': 'pesticide',
      'insecticide': 'pesticide',
      'fungicide': 'pesticide',
      'herbicide': 'pesticide',
      
      'harvest': 'harvest',
      'harvesting': 'harvest',
      'yield': 'harvest',
      'crop collection': 'harvest',
      
      'sowing': 'sowing',
      'seed': 'sowing',
      'germination': 'sowing',
      'seed treatment': 'sowing',
    };
    
    // Apply mapping if the type is not already correct
    if (!Object.values(typeMapping).includes(normalizedType)) {
      normalizedType = typeMapping[normalizedType] || 'other';
    }
    
    // Fallback for date if not set by AI
    let date = output?.date || new Date().toISOString().slice(0, 10);
    let createdAt = new Date().toISOString();
    
    return {
      rawText,
      type: normalizedType,
      date,
      createdAt,
    };
  }
);

export async function runExtractFarmJournalEntry(rawText: string) {
  return farmJournalExtractFlow({ rawText });
} 