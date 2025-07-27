import { ai } from "@/ai/genkit";
import { z } from "zod";
import { db } from "@/firebaseStore/firebase";
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  addDoc
} from "firebase/firestore";

// Farm Journal Entry Interface
interface FarmJournalEntry {
  id?: string;
  rawText: string;
  type: 'land preparation' | 'sowing' | 'crop management' | 'irrigation' | 'fertilizer' | 'pest control' | 'weather' | 'harvest' | 'post-harvest' | 'sales' | 'finance' | 'equipment' | 'other';
  date: string; // ISO date string
  createdAt: string; // ISO timestamp
  userId: string;
  location?: string;
  crop?: string;
  quantity?: string;
  cost?: number;
  weather?: string;
  notes?: string;
  tags?: string[];
  photos?: string[];
  aiExtracted?: boolean;
}

// Journal Analysis Interface
interface JournalAnalysis {
  totalEntries: number;
  entriesByType: Record<string, number>;
  entriesByMonth: Record<string, number>;
  mostActiveDay: string;
  mostCommonCrop: string;
  totalCost: number;
  averageCostPerEntry: number;
  weatherPatterns: Record<string, number>;
  productivityTrends: any[];
}

export const farmJournalTool = ai.defineTool(
  {
    name: "farm_journal_tool",
    description: "Farm journal management tool for creating, categorizing, and analyzing farm activities and observations",
    inputSchema: z.object({
      action: z.enum([
        "create_entry",
        "get_entry",
        "update_entry",
        "delete_entry",
        "get_user_entries",
        "get_entries_by_type",
        "get_entries_by_date_range",
        "get_entries_by_crop",
        "search_entries",
        "analyze_journal",
        "extract_from_text",
        "categorize_entry",
        "get_statistics",
        "export_journal",
        "import_journal",
        "get_recent_entries",
        "get_entries_by_weather",
        "get_cost_analysis",
        "get_productivity_trends",
        "generate_summary"
      ]),
      userId: z.string().optional(),
      entryId: z.string().optional(),
      entryData: z.object({
        rawText: z.string().optional(),
        type: z.enum(['land preparation', 'sowing', 'crop management', 'irrigation', 'fertilizer', 'pest control', 'weather', 'harvest', 'post-harvest', 'sales', 'finance', 'equipment', 'other']).optional(),
        date: z.string().optional(), // ISO date string
        location: z.string().optional(),
        crop: z.string().optional(),
        quantity: z.string().optional(),
        cost: z.number().optional(),
        weather: z.string().optional(),
        notes: z.string().optional(),
        tags: z.array(z.string()).optional(),
        photos: z.array(z.string()).optional()
      }).optional(),
      searchQuery: z.string().optional(),
      startDate: z.string().optional(), // ISO date string
      endDate: z.string().optional(), // ISO date string
      entryType: z.enum(['land preparation', 'sowing', 'crop management', 'irrigation', 'fertilizer', 'pest control', 'weather', 'harvest', 'post-harvest', 'sales', 'finance', 'equipment', 'other']).optional(),
      crop: z.string().optional(),
      limit: z.number().optional(),
      rawText: z.string().optional(), // For AI extraction
      exportFormat: z.enum(['json', 'csv', 'pdf']).optional(),
      importData: z.array(z.record(z.any())).optional()
    }),
    outputSchema: z.object({
      success: z.boolean(),
      error: z.string().optional(),
      message: z.string().optional(),
      entryId: z.string().optional(),
      entry: z.any().optional(),
      entries: z.array(z.any()).optional(),
      count: z.number().optional(),
      analysis: z.any().optional(),
      extractedEntry: z.any().optional(),
      category: z.string().optional(),
      confidence: z.number().optional(),
      statistics: z.any().optional(),
      export: z.any().optional(),
      results: z.array(z.any()).optional(),
      costAnalysis: z.any().optional(),
      productivityTrends: z.array(z.any()).optional(),
      summary: z.any().optional()
    })
  },
  async (input) => {
    const { 
      action, 
      userId, 
      entryId, 
      entryData, 
      searchQuery, 
      startDate, 
      endDate, 
      entryType, 
      crop,
      limit: limitCount,
      rawText,
      exportFormat,
      importData
    } = input;

    try {
      if (!userId && action !== "extract_from_text" && action !== "categorize_entry") {
        throw new Error("userId is required for most operations");
      }

      switch (action) {
        case "create_entry":
          if (!entryData || !entryData.rawText) {
            throw new Error("entryData with rawText is required for creating entries");
          }
          
          const newEntryId = entryId || `entry_${Date.now()}`;
          const entryDoc = doc(db, 'farm_journal', userId!, 'entries', newEntryId);
          
          const now = new Date();
          const newEntry: FarmJournalEntry = {
            id: newEntryId,
            rawText: entryData.rawText,
            type: entryData.type || 'other',
            date: entryData.date || now.toISOString().split('T')[0],
            createdAt: now.toISOString(),
            userId: userId!,
            location: entryData.location,
            crop: entryData.crop,
            quantity: entryData.quantity,
            cost: entryData.cost,
            weather: entryData.weather,
            notes: entryData.notes,
            tags: entryData.tags || [],
            photos: entryData.photos || [],
            aiExtracted: false
          };
          
          await setDoc(entryDoc, newEntry);
          return { success: true, entryId: newEntryId, entry: newEntry };

        case "get_entry":
          if (!entryId) {
            throw new Error("entryId is required for getting an entry");
          }
          
          const getEntryRef = doc(db, 'farm_journal', userId!, 'entries', entryId);
          const entrySnap = await getDoc(getEntryRef);
          
          if (entrySnap.exists()) {
            return { success: true, entry: entrySnap.data() };
          } else {
            return { success: false, message: "Entry not found" };
          }

        case "update_entry":
          if (!entryId || !entryData) {
            throw new Error("entryId and entryData are required for updating entries");
          }
          
          const updateEntryRef = doc(db, 'farm_journal', userId!, 'entries', entryId);
          const updateData: any = { updatedAt: new Date().toISOString() };
          
          if (entryData.rawText !== undefined) updateData.rawText = entryData.rawText;
          if (entryData.type !== undefined) updateData.type = entryData.type;
          if (entryData.date !== undefined) updateData.date = entryData.date;
          if (entryData.location !== undefined) updateData.location = entryData.location;
          if (entryData.crop !== undefined) updateData.crop = entryData.crop;
          if (entryData.quantity !== undefined) updateData.quantity = entryData.quantity;
          if (entryData.cost !== undefined) updateData.cost = entryData.cost;
          if (entryData.weather !== undefined) updateData.weather = entryData.weather;
          if (entryData.notes !== undefined) updateData.notes = entryData.notes;
          if (entryData.tags !== undefined) updateData.tags = entryData.tags;
          if (entryData.photos !== undefined) updateData.photos = entryData.photos;
          
          await updateDoc(updateEntryRef, updateData);
          return { success: true, message: "Entry updated successfully" };

        case "delete_entry":
          if (!entryId) {
            throw new Error("entryId is required for deleting entries");
          }
          
          const deleteEntryRef = doc(db, 'farm_journal', userId!, 'entries', entryId);
          await deleteDoc(deleteEntryRef);
          return { success: true, message: "Entry deleted successfully" };

        case "get_user_entries":
          const userEntriesQuery = query(
            collection(db, 'farm_journal', userId!, 'entries'),
            orderBy('createdAt', 'desc')
          );
          
          const userEntriesSnap = await getDocs(userEntriesQuery);
          const userEntries = userEntriesSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as FarmJournalEntry[];
          
          return { success: true, entries: userEntries, count: userEntries.length };

        case "get_entries_by_type":
          if (!entryType) {
            throw new Error("entryType is required for filtering entries by type");
          }
          
          const typeEntriesQuery = query(
            collection(db, 'farm_journal', userId!, 'entries'),
            where('type', '==', entryType),
            orderBy('createdAt', 'desc')
          );
          
          const typeEntriesSnap = await getDocs(typeEntriesQuery);
          const typeEntries = typeEntriesSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as FarmJournalEntry[];
          
          return { success: true, entries: typeEntries, count: typeEntries.length };

        case "get_entries_by_date_range":
          if (!startDate || !endDate) {
            throw new Error("startDate and endDate are required for date range queries");
          }
          
          const dateEntriesQuery = query(
            collection(db, 'farm_journal', userId!, 'entries'),
            where('date', '>=', startDate),
            where('date', '<=', endDate),
            orderBy('date', 'desc')
          );
          
          const dateEntriesSnap = await getDocs(dateEntriesQuery);
          const dateEntries = dateEntriesSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as FarmJournalEntry[];
          
          return { success: true, entries: dateEntries, count: dateEntries.length };

        case "get_entries_by_crop":
          if (!crop) {
            throw new Error("crop is required for filtering entries by crop");
          }
          
          const cropEntriesQuery = query(
            collection(db, 'farm_journal', userId!, 'entries'),
            where('crop', '==', crop),
            orderBy('createdAt', 'desc')
          );
          
          const cropEntriesSnap = await getDocs(cropEntriesQuery);
          const cropEntries = cropEntriesSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as FarmJournalEntry[];
          
          return { success: true, entries: cropEntries, count: cropEntries.length };

        case "search_entries":
          if (!searchQuery) {
            throw new Error("searchQuery is required for searching entries");
          }
          
          const allEntriesQuery = query(
            collection(db, 'farm_journal', userId!, 'entries'),
            orderBy('createdAt', 'desc')
          );
          
          const allEntriesSnap = await getDocs(allEntriesQuery);
          const allEntries = allEntriesSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as FarmJournalEntry[];
          
          // Simple text search (in production, consider using Algolia or similar)
          const searchResults = allEntries.filter(entry => 
            entry.rawText?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            entry.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            entry.crop?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            entry.location?.toLowerCase().includes(searchQuery.toLowerCase())
          );
          
          return { success: true, entries: searchResults, count: searchResults.length };

        case "analyze_journal":
          const analysisQuery = query(
            collection(db, 'farm_journal', userId!, 'entries'),
            orderBy('createdAt', 'desc')
          );
          
          const analysisSnap = await getDocs(analysisQuery);
          const analysisEntries = analysisSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as FarmJournalEntry[];
          
          // Perform analysis
          const analysis: JournalAnalysis = {
            totalEntries: analysisEntries.length,
            entriesByType: {},
            entriesByMonth: {},
            mostActiveDay: '',
            mostCommonCrop: '',
            totalCost: 0,
            averageCostPerEntry: 0,
            weatherPatterns: {},
            productivityTrends: []
          };
          
          const typeCount: Record<string, number> = {};
          const monthCount: Record<string, number> = {};
          const dayCount: Record<string, number> = {};
          const cropCount: Record<string, number> = {};
          const weatherCount: Record<string, number> = {};
          let totalCost = 0;
          let costEntriesCount = 0;
          
          analysisEntries.forEach(entry => {
            // Count by type
            typeCount[entry.type] = (typeCount[entry.type] || 0) + 1;
            
            // Count by month
            const month = entry.date?.substring(0, 7) || '';
            monthCount[month] = (monthCount[month] || 0) + 1;
            
            // Count by day
            dayCount[entry.date] = (dayCount[entry.date] || 0) + 1;
            
            // Count by crop
            if (entry.crop) {
              cropCount[entry.crop] = (cropCount[entry.crop] || 0) + 1;
            }
            
            // Count by weather
            if (entry.weather) {
              weatherCount[entry.weather] = (weatherCount[entry.weather] || 0) + 1;
            }
            
            // Sum costs
            if (entry.cost) {
              totalCost += entry.cost;
              costEntriesCount++;
            }
          });
          
          analysis.entriesByType = typeCount;
          analysis.entriesByMonth = monthCount;
          analysis.totalCost = totalCost;
          analysis.averageCostPerEntry = costEntriesCount > 0 ? totalCost / costEntriesCount : 0;
          analysis.weatherPatterns = weatherCount;
          
          // Find most active day
          const mostActiveDay = Object.entries(dayCount).reduce((a, b) => dayCount[a[0]] > dayCount[b[0]] ? a : b);
          analysis.mostActiveDay = mostActiveDay[0];
          
          // Find most common crop
          const mostCommonCrop = Object.entries(cropCount).reduce((a, b) => cropCount[a[0]] > cropCount[b[0]] ? a : b);
          analysis.mostCommonCrop = mostCommonCrop[0];
          
          return { success: true, analysis };

        case "extract_from_text":
          if (!rawText) {
            throw new Error("rawText is required for AI extraction");
          }
          
          // AI-powered extraction logic
          const lowerTextForExtraction = rawText.toLowerCase();
          let extractedType: FarmJournalEntry['type'] = 'other';
          let extractedCrop: string | undefined;
          let extractedQuantity: string | undefined;
          let extractedCost: number | undefined;
          let extractedWeather: string | undefined;
          
          // Extract type
          if (lowerTextForExtraction.includes('plant') || lowerTextForExtraction.includes('sow') || lowerTextForExtraction.includes('seed')) {
            extractedType = 'sowing';
          } else if (lowerTextForExtraction.includes('water') || lowerTextForExtraction.includes('irrigat')) {
            extractedType = 'irrigation';
          } else if (lowerTextForExtraction.includes('fertiliz') || lowerTextForExtraction.includes('npk') || lowerTextForExtraction.includes('manure')) {
            extractedType = 'fertilizer';
          } else if (lowerTextForExtraction.includes('pest') || lowerTextForExtraction.includes('spray') || lowerTextForExtraction.includes('insecticide')) {
            extractedType = 'pest control';
          } else if (lowerTextForExtraction.includes('harvest') || lowerTextForExtraction.includes('pick') || lowerTextForExtraction.includes('collect')) {
            extractedType = 'harvest';
          } else if (lowerTextForExtraction.includes('weather') || lowerTextForExtraction.includes('rain') || lowerTextForExtraction.includes('sun') || lowerTextForExtraction.includes('wind')) {
            extractedType = 'weather';
          } else if (lowerTextForExtraction.includes('sell') || lowerTextForExtraction.includes('market') || lowerTextForExtraction.includes('price')) {
            extractedType = 'sales';
          } else if (lowerTextForExtraction.includes('cost') || lowerTextForExtraction.includes('money') || lowerTextForExtraction.includes('expense') || lowerTextForExtraction.includes('rs') || lowerTextForExtraction.includes('₹')) {
            extractedType = 'finance';
          }
          
          // Extract crop
          const crops = ['tomato', 'wheat', 'rice', 'maize', 'cotton', 'potato', 'onion', 'pepper', 'cucumber', 'lettuce', 'corn', 'soybean'];
          for (const cropName of crops) {
            if (lowerTextForExtraction.includes(cropName)) {
              extractedCrop = cropName;
              break;
            }
          }
          
          // Extract quantity
          const quantityMatch = rawText.match(/(\d+)\s*(kg|kgs|kilo|kilos|liters?|l|acres?|hectares?|bags?)/i);
          if (quantityMatch) {
            extractedQuantity = `${quantityMatch[1]} ${quantityMatch[2]}`;
          }
          
          // Extract cost
          const costMatch = rawText.match(/(\d+)\s*(rs|rupees?|₹|rupee)/i);
          if (costMatch) {
            extractedCost = parseInt(costMatch[1]);
          }
          
          // Extract weather
          if (lowerTextForExtraction.includes('rain') || lowerTextForExtraction.includes('rainy')) {
            extractedWeather = 'rainy';
          } else if (lowerTextForExtraction.includes('sunny') || lowerTextForExtraction.includes('hot')) {
            extractedWeather = 'sunny';
          } else if (lowerTextForExtraction.includes('cloudy')) {
            extractedWeather = 'cloudy';
          } else if (lowerTextForExtraction.includes('windy')) {
            extractedWeather = 'windy';
          }
          
          const extractedEntry = {
            rawText,
            type: extractedType,
            crop: extractedCrop,
            quantity: extractedQuantity,
            cost: extractedCost,
            weather: extractedWeather,
            aiExtracted: true
          };
          
          return { success: true, extractedEntry };

        case "categorize_entry":
          if (!rawText) {
            throw new Error("rawText is required for categorization");
          }
          
          // Simple categorization logic
          const lowerTextForCategorization = rawText.toLowerCase();
          let category: FarmJournalEntry['type'] = 'other';
          
          if (lowerTextForCategorization.includes('plant') || lowerTextForCategorization.includes('sow') || lowerTextForCategorization.includes('seed')) {
            category = 'sowing';
          } else if (lowerTextForCategorization.includes('water') || lowerTextForCategorization.includes('irrigat')) {
            category = 'irrigation';
          } else if (lowerTextForCategorization.includes('fertiliz') || lowerTextForCategorization.includes('npk') || lowerTextForCategorization.includes('manure')) {
            category = 'fertilizer';
          } else if (lowerTextForCategorization.includes('pest') || lowerTextForCategorization.includes('spray') || lowerTextForCategorization.includes('insecticide')) {
            category = 'pest control';
          } else if (lowerTextForCategorization.includes('harvest') || lowerTextForCategorization.includes('pick') || lowerTextForCategorization.includes('collect')) {
            category = 'harvest';
          } else if (lowerTextForCategorization.includes('weather') || lowerTextForCategorization.includes('rain') || lowerTextForCategorization.includes('sun') || lowerTextForCategorization.includes('wind')) {
            category = 'weather';
          } else if (lowerTextForCategorization.includes('sell') || lowerTextForCategorization.includes('market') || lowerTextForCategorization.includes('price')) {
            category = 'sales';
          } else if (lowerTextForCategorization.includes('cost') || lowerTextForCategorization.includes('money') || lowerTextForCategorization.includes('expense')) {
            category = 'finance';
          } else if (lowerTextForCategorization.includes('equipment') || lowerTextForCategorization.includes('machine') || lowerTextForCategorization.includes('tool')) {
            category = 'equipment';
          } else if (lowerTextForCategorization.includes('land') || lowerTextForCategorization.includes('soil') || lowerTextForCategorization.includes('prepare')) {
            category = 'land preparation';
          } else if (lowerTextForCategorization.includes('manage') || lowerTextForCategorization.includes('care') || lowerTextForCategorization.includes('maintain')) {
            category = 'crop management';
          } else if (lowerTextForCategorization.includes('post') || lowerTextForCategorization.includes('after') || lowerTextForCategorization.includes('storage')) {
            category = 'post-harvest';
          }
          
          return { success: true, category, confidence: 0.8 };

        case "get_statistics":
          const statsQuery = query(
            collection(db, 'farm_journal', userId!, 'entries'),
            orderBy('createdAt', 'desc')
          );
          
          const statsSnap = await getDocs(statsQuery);
          const statsEntries = statsSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as FarmJournalEntry[];
          
          const stats = {
            totalEntries: statsEntries.length,
            entriesThisMonth: statsEntries.filter(entry => {
              const entryDate = new Date(entry.date);
              const now = new Date();
              return entryDate.getMonth() === now.getMonth() && entryDate.getFullYear() === now.getFullYear();
            }).length,
            entriesThisWeek: statsEntries.filter(entry => {
              const entryDate = new Date(entry.date);
              const now = new Date();
              const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              return entryDate >= weekAgo;
            }).length,
            totalCost: statsEntries.reduce((sum, entry) => sum + (entry.cost || 0), 0),
            averageCostPerEntry: statsEntries.length > 0 ? 
              statsEntries.reduce((sum, entry) => sum + (entry.cost || 0), 0) / statsEntries.length : 0,
            mostActiveType: Object.entries(
              statsEntries.reduce((acc, entry) => {
                acc[entry.type] = (acc[entry.type] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            ).reduce((a, b) => a[1] > b[1] ? a : b)[0]
          };
          
          return { success: true, statistics: stats };

        case "export_journal":
          if (!exportFormat) {
            throw new Error("exportFormat is required for exporting journal");
          }
          
          const exportQuery = query(
            collection(db, 'farm_journal', userId!, 'entries'),
            orderBy('createdAt', 'desc')
          );
          
          const exportSnap = await getDocs(exportQuery);
          const exportEntries = exportSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as FarmJournalEntry[];
          
          let formattedData;
          switch (exportFormat) {
            case "json":
              formattedData = JSON.stringify(exportEntries, null, 2);
              break;
            case "csv":
              if (exportEntries.length > 0) {
                const headers = ['id', 'rawText', 'type', 'date', 'crop', 'quantity', 'cost', 'weather', 'notes'];
                const csvRows = [headers.join(",")];
                for (const entry of exportEntries) {
                  const values = headers.map(header => {
                    const value = entry[header as keyof typeof entry];
                    return typeof value === "string" ? `"${value}"` : value;
                  });
                  csvRows.push(values.join(","));
                }
                formattedData = csvRows.join("\n");
              } else {
                formattedData = "";
              }
              break;
            case "pdf":
              formattedData = "PDF export would be generated here";
              break;
          }
          
          return {
            success: true,
            export: {
              format: exportFormat,
              documentCount: exportEntries.length,
              data: formattedData
            }
          };

        case "import_journal":
          if (!importData) {
            throw new Error("importData is required for importing journal");
          }
          
          const importResults = [];
          
          for (const item of importData) {
            const newEntryId = `imported_${Date.now()}_${Math.random()}`;
            const entryDoc = doc(db, 'farm_journal', userId!, 'entries', newEntryId);
            
            const importEntry = {
              ...item,
              id: newEntryId,
              userId: userId!,
              createdAt: new Date().toISOString(),
              importedAt: new Date().toISOString()
            };
            
            await setDoc(entryDoc, importEntry);
            importResults.push({
              documentId: newEntryId,
              imported: true
            });
          }
          
          return {
            success: true,
            message: `Imported ${importResults.length} entries`,
            results: importResults
          };

        case "get_recent_entries":
          const recentQuery = query(
            collection(db, 'farm_journal', userId!, 'entries'),
            orderBy('createdAt', 'desc'),
            limit(limitCount || 10)
          );
          
          const recentSnap = await getDocs(recentQuery);
          const recentEntries = recentSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as FarmJournalEntry[];
          
          return { success: true, entries: recentEntries, count: recentEntries.length };

        case "get_entries_by_weather":
          if (!searchQuery) {
            throw new Error("searchQuery (weather condition) is required for weather filtering");
          }
          
          const weatherEntriesQuery = query(
            collection(db, 'farm_journal', userId!, 'entries'),
            where('weather', '==', searchQuery),
            orderBy('createdAt', 'desc')
          );
          
          const weatherEntriesSnap = await getDocs(weatherEntriesQuery);
          const weatherEntries = weatherEntriesSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as FarmJournalEntry[];
          
          return { success: true, entries: weatherEntries, count: weatherEntries.length };

        case "get_cost_analysis":
          const costQuery = query(
            collection(db, 'farm_journal', userId!, 'entries'),
            orderBy('createdAt', 'desc')
          );
          
          const costSnap = await getDocs(costQuery);
          const costEntries = costSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as FarmJournalEntry[];
          
          const costAnalysis = {
            totalCost: costEntries.reduce((sum, entry) => sum + (entry.cost || 0), 0),
            averageCostPerEntry: costEntries.length > 0 ? 
              costEntries.reduce((sum, entry) => sum + (entry.cost || 0), 0) / costEntries.length : 0,
            costByType: costEntries.reduce((acc, entry) => {
              if (entry.cost) {
                acc[entry.type] = (acc[entry.type] || 0) + entry.cost;
              }
              return acc;
            }, {} as Record<string, number>),
            costByMonth: costEntries.reduce((acc, entry) => {
              if (entry.cost && entry.date) {
                const month = entry.date.substring(0, 7);
                acc[month] = (acc[month] || 0) + entry.cost;
              }
              return acc;
            }, {} as Record<string, number>),
            entriesWithCost: costEntries.filter(entry => entry.cost).length
          };
          
          return { success: true, costAnalysis };

        case "get_productivity_trends":
          const productivityQuery = query(
            collection(db, 'farm_journal', userId!, 'entries'),
            orderBy('createdAt', 'desc')
          );
          
          const productivitySnap = await getDocs(productivityQuery);
          const productivityEntries = productivitySnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as FarmJournalEntry[];
          
          // Group by month and calculate productivity metrics
          const monthlyProductivity = productivityEntries.reduce((acc, entry) => {
            const month = entry.date?.substring(0, 7) || '';
            if (!acc[month]) {
              acc[month] = {
                month,
                totalEntries: 0,
                harvestEntries: 0,
                costEntries: 0,
                totalCost: 0
              };
            }
            
            acc[month].totalEntries++;
            if (entry.type === 'harvest') acc[month].harvestEntries++;
            if (entry.cost) {
              acc[month].costEntries++;
              acc[month].totalCost += entry.cost;
            }
            
            return acc;
          }, {} as Record<string, any>);
          
          return { success: true, productivityTrends: Object.values(monthlyProductivity) };

        case "generate_summary":
          const summaryQuery = query(
            collection(db, 'farm_journal', userId!, 'entries'),
            orderBy('createdAt', 'desc'),
            limit(50) // Last 50 entries for summary
          );
          
          const summarySnap = await getDocs(summaryQuery);
          const summaryEntries = summarySnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as FarmJournalEntry[];
          
          const summary = {
            totalEntries: summaryEntries.length,
            dateRange: {
              start: summaryEntries[summaryEntries.length - 1]?.date,
              end: summaryEntries[0]?.date
            },
            activitySummary: summaryEntries.reduce((acc, entry) => {
              acc[entry.type] = (acc[entry.type] || 0) + 1;
              return acc;
            }, {} as Record<string, number>),
            crops: [...new Set(summaryEntries.map(entry => entry.crop).filter(Boolean))],
            totalCost: summaryEntries.reduce((sum, entry) => sum + (entry.cost || 0), 0),
            weatherEvents: summaryEntries.filter(entry => entry.type === 'weather').length
          };
          
          return { success: true, summary };

        default:
          throw new Error(`Unknown action: ${action}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }
); 