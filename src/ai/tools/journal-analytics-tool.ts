import { z } from "zod";
import { ai } from "@/ai/genkit";
import { db } from "@/firebaseStore/firebase";
import { 
  collection, 
  query, 
  getDocs, 
  orderBy,
  where,
  limit,
  Timestamp
} from "firebase/firestore";

// Analytics Interfaces
interface JournalInsights {
  productivityScore: number;
  costEfficiency: number;
  weatherImpact: number;
  cropPerformance: Record<string, any>;
  seasonalTrends: any[];
  recommendations: string[];
  riskFactors: string[];
  opportunities: string[];
}

interface CropAnalysis {
  cropName: string;
  totalEntries: number;
  totalCost: number;
  averageCostPerEntry: number;
  successRate: number;
  seasonalPattern: any[];
  yieldEstimate: number;
  profitMargin: number;
}

interface WeatherAnalysis {
  weatherType: string;
  frequency: number;
  impactOnCrops: string[];
  costImplications: number;
  recommendations: string[];
}

interface FinancialAnalysis {
  totalInvestment: number;
  totalRevenue: number;
  netProfit: number;
  profitMargin: number;
  costBreakdown: Record<string, number>;
  revenueByCrop: Record<string, number>;
  monthlyTrends: any[];
  roi: number;
}

export const journalAnalyticsTool = ai.defineTool({
  name: "journal_analytics_tool",
  description: "Advanced analytics and insights tool for farm journal data analysis, productivity tracking, and financial reporting",
  inputSchema: z.object({
    action: z.enum([
      "generate_insights",
      "analyze_crop_performance",
      "analyze_weather_impact",
      "analyze_financial_performance",
      "generate_productivity_report",
      "predict_yield",
      "identify_trends",
      "generate_recommendations",
      "analyze_seasonal_patterns",
      "calculate_roi",
      "risk_assessment",
      "opportunity_analysis",
      "compare_periods",
      "generate_forecast",
      "benchmark_analysis"
    ]),
    userId: z.string().optional(),
    cropName: z.string().optional(),
    startDate: z.string().optional(), // ISO date string
    endDate: z.string().optional(), // ISO date string
    analysisType: z.enum(['productivity', 'financial', 'weather', 'crop', 'comprehensive']).optional(),
    period: z.enum(['week', 'month', 'quarter', 'year', 'all']).optional(),
    includePredictions: z.boolean().optional(),
    benchmarkData: z.record(z.any()).optional()
  }),
  outputSchema: z.object({
    success: z.boolean(),
    data: z.any().optional(),
    message: z.string().optional()
  })
}, async ({ 
    action, 
    userId, 
    cropName, 
    startDate, 
    endDate, 
    analysisType,
    period,
    includePredictions,
    benchmarkData
  }) => {
    try {
      if (!userId) {
        throw new Error("userId is required for analytics operations");
      }

      // Fetch journal entries for analysis
      const entriesQuery = query(
        collection(db, 'farm_journal', userId, 'entries'),
        orderBy('createdAt', 'desc')
      );
      
      const entriesSnap = await getDocs(entriesQuery);
      const entries = entriesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filter by date range if provided
      let filteredEntries = entries;
      if (startDate && endDate) {
        filteredEntries = entries.filter(entry => 
          (entry as any).date >= startDate && (entry as any).date <= endDate
        );
      }

      switch (action) {
        case "generate_insights":
          const insights: JournalInsights = {
            productivityScore: 0,
            costEfficiency: 0,
            weatherImpact: 0,
            cropPerformance: {},
            seasonalTrends: [],
            recommendations: [],
            riskFactors: [],
            opportunities: []
          };

          // Calculate productivity score
          const totalEntriesCount = filteredEntries.length;
          const harvestEntriesCount = filteredEntries.filter(entry => (entry as any).type === 'harvest').length;
          const costEntriesCount = filteredEntries.filter(entry => (entry as any).cost).length;
          const totalCostValue = filteredEntries.reduce((sum, entry) => sum + ((entry as any).cost || 0), 0);

          insights.productivityScore = totalEntriesCount > 0 ? (harvestEntriesCount / totalEntriesCount) * 100 : 0;
          insights.costEfficiency = costEntriesCount > 0 ? (totalCostValue / costEntriesCount) : 0;

          // Analyze crop performance
          const cropTypes = [...new Set(filteredEntries.map(entry => (entry as any).crop).filter(Boolean))];
          cropTypes.forEach(crop => {
            const cropEntriesFiltered = filteredEntries.filter(entry => (entry as any).crop === crop);
            const cropCostValue = cropEntriesFiltered.reduce((sum, entry) => sum + ((entry as any).cost || 0), 0);
            const cropHarvestsCount = cropEntriesFiltered.filter(entry => (entry as any).type === 'harvest').length;
            
            (insights.cropPerformance as Record<string, any>)[crop] = {
              totalEntries: cropEntriesFiltered.length,
              totalCost: cropCostValue,
              harvestCount: cropHarvestsCount,
              successRate: cropEntriesFiltered.length > 0 ? (cropHarvestsCount / cropEntriesFiltered.length) * 100 : 0
            };
          });

          // Generate recommendations
          if (insights.productivityScore < 50) {
            insights.recommendations.push("Consider increasing harvest activities and monitoring crop health more frequently");
          }
          if (insights.costEfficiency > 1000) {
            insights.recommendations.push("Review cost management strategies to optimize spending");
          }

          return { success: true, insights };

        case "analyze_crop_performance":
          if (!cropName) {
            throw new Error("cropName is required for crop performance analysis");
          }

          const cropEntriesFiltered = filteredEntries.filter(entry => (entry as any).crop === cropName);
          const cropAnalysis: CropAnalysis = {
            cropName,
            totalEntries: cropEntriesFiltered.length,
            totalCost: cropEntriesFiltered.reduce((sum, entry) => sum + ((entry as any).cost || 0), 0),
            averageCostPerEntry: 0,
            successRate: 0,
            seasonalPattern: [],
            yieldEstimate: 0,
            profitMargin: 0
          };

          cropAnalysis.averageCostPerEntry = cropEntriesFiltered.length > 0 ? 
            cropAnalysis.totalCost / cropEntriesFiltered.length : 0;

          const harvestEntriesFiltered = cropEntriesFiltered.filter(entry => (entry as any).type === 'harvest');
          cropAnalysis.successRate = cropEntriesFiltered.length > 0 ? 
            (harvestEntriesFiltered.length / cropEntriesFiltered.length) * 100 : 0;

          // Analyze seasonal patterns
          const monthlyDataForCrop = cropEntriesFiltered.reduce((acc, entry) => {
            const month = (entry as any).date?.substring(5, 7) || '';
            if (!acc[month]) acc[month] = { entries: 0, cost: 0 };
            acc[month].entries++;
            acc[month].cost += (entry as any).cost || 0;
            return acc;
          }, {} as Record<string, any>);

          cropAnalysis.seasonalPattern = Object.entries(monthlyDataForCrop).map(([month, data]) => ({
            month,
            entries: data.entries,
            cost: data.cost
          }));

          // Estimate yield based on harvest entries
          cropAnalysis.yieldEstimate = harvestEntriesFiltered.length * 100; // Simplified estimation

          return { success: true, cropAnalysis };

        case "analyze_weather_impact":
          const weatherEntriesFiltered = filteredEntries.filter(entry => (entry as any).type === 'weather');
          const weatherAnalysis: WeatherAnalysis[] = [];

          const weatherTypes = [...new Set(weatherEntriesFiltered.map(entry => (entry as any).weather).filter(Boolean))];
          
          weatherTypes.forEach(weatherType => {
            const typeEntries = weatherEntriesFiltered.filter(entry => (entry as any).weather === weatherType);
            const affectedCrops = [...new Set(typeEntries.map(entry => (entry as any).crop).filter(Boolean))];
            
            weatherAnalysis.push({
              weatherType,
              frequency: typeEntries.length,
              impactOnCrops: affectedCrops,
              costImplications: typeEntries.reduce((sum, entry) => sum + ((entry as any).cost || 0), 0),
              recommendations: generateWeatherRecommendations(weatherType)
            });
          });

          return { success: true, weatherAnalysis };

        case "analyze_financial_performance":
          const financialAnalysis: FinancialAnalysis = {
            totalInvestment: 0,
            totalRevenue: 0,
            netProfit: 0,
            profitMargin: 0,
            costBreakdown: {},
            revenueByCrop: {},
            monthlyTrends: [],
            roi: 0
          };

          // Calculate total investment (costs)
          financialAnalysis.totalInvestment = filteredEntries.reduce((sum, entry) => sum + ((entry as any).cost || 0), 0);

          // Calculate revenue from harvest entries
          const harvestEntriesForRevenue = filteredEntries.filter(entry => (entry as any).type === 'harvest');
          financialAnalysis.totalRevenue = harvestEntriesForRevenue.reduce((sum, entry) => sum + ((entry as any).revenue || 0), 0);

          financialAnalysis.netProfit = financialAnalysis.totalRevenue - financialAnalysis.totalInvestment;
          financialAnalysis.profitMargin = financialAnalysis.totalRevenue > 0 ? 
            (financialAnalysis.netProfit / financialAnalysis.totalRevenue) * 100 : 0;

          // Calculate ROI
          financialAnalysis.roi = financialAnalysis.totalInvestment > 0 ? 
            (financialAnalysis.netProfit / financialAnalysis.totalInvestment) * 100 : 0;

          // Cost breakdown by crop
          const cropTypesForCost = [...new Set(filteredEntries.map(entry => (entry as any).crop).filter(Boolean))];
          cropTypesForCost.forEach(crop => {
            const cropEntriesForCost = filteredEntries.filter(entry => (entry as any).crop === crop);
            financialAnalysis.costBreakdown[crop] = cropEntriesForCost.reduce((sum, entry) => sum + ((entry as any).cost || 0), 0);
          });

          return { success: true, financialAnalysis };

        case "generate_productivity_report":
          const productivityReport = {
            summary: {
              totalEntries: filteredEntries.length,
              harvestEntries: filteredEntries.filter(entry => (entry as any).type === 'harvest').length,
              irrigationEntries: filteredEntries.filter(entry => (entry as any).type === 'irrigation').length,
              fertilizerEntries: filteredEntries.filter(entry => (entry as any).type === 'fertilizer').length,
              weatherEntries: filteredEntries.filter(entry => (entry as any).type === 'weather').length
            },
            cropPerformance: {} as Record<string, any>,
            weatherImpact: {},
            recommendations: [] as string[]
          };

          // Analyze crop performance
          const cropTypesForReport = [...new Set(filteredEntries.map(entry => (entry as any).crop).filter(Boolean))];
          cropTypesForReport.forEach(crop => {
            const cropEntriesForReport = filteredEntries.filter(entry => (entry as any).crop === crop);
            const harvestCount = cropEntriesForReport.filter(entry => (entry as any).type === 'harvest').length;
            const weatherImpact = cropEntriesForReport.filter(entry => (entry as any).type === 'weather').length;
            
            productivityReport.cropPerformance[crop] = {
              totalEntries: cropEntriesForReport.length,
              harvestCount,
              weatherImpact,
              successRate: cropEntriesForReport.length > 0 ? (harvestCount / cropEntriesForReport.length) * 100 : 0
            };
          });

          // Generate recommendations
          if (productivityReport.summary.harvestEntries < productivityReport.summary.totalEntries * 0.3) {
            productivityReport.recommendations.push("Increase harvest monitoring and activities");
          }
          if (productivityReport.summary.irrigationEntries < productivityReport.summary.totalEntries * 0.2) {
            productivityReport.recommendations.push("Consider automated irrigation systems");
          }
          if (productivityReport.summary.fertilizerEntries < productivityReport.summary.totalEntries * 0.1) {
            productivityReport.recommendations.push("Consider organic alternatives for cost reduction");
          }
          if (productivityReport.summary.weatherEntries < productivityReport.summary.totalEntries * 0.1) {
            productivityReport.recommendations.push("Implement better crop management practices");
          }

          return { success: true, productivityReport };

        case "predict_yield":
          const yieldPrediction = {
            predictedYield: 0,
            confidence: 0,
            factors: [] as string[],
            recommendations: [] as string[]
          };

          // Simple yield prediction based on harvest entries
          const harvestEntriesForYield = filteredEntries.filter(entry => (entry as any).type === 'harvest');
          const weatherEntriesForYield = filteredEntries.filter(entry => (entry as any).type === 'weather');
          const irrigationEntriesForYield = filteredEntries.filter(entry => (entry as any).type === 'irrigation');

          // Base prediction on historical data
          yieldPrediction.predictedYield = harvestEntriesForYield.length * 150; // kg per harvest
          yieldPrediction.confidence = Math.min(90, 50 + harvestEntriesForYield.length * 5);

          // Analyze factors
          if (weatherEntriesForYield.length > 0) {
            yieldPrediction.factors.push("Weather conditions monitored");
          }
          if (irrigationEntriesForYield.length > 0) {
            yieldPrediction.factors.push("Irrigation practices tracked");
          }

          // Generate recommendations
          if (yieldPrediction.predictedYield < 1000) {
            yieldPrediction.recommendations.push("Consider increasing irrigation frequency");
            yieldPrediction.recommendations.push("Monitor soil moisture levels");
          }

          return { success: true, yieldPrediction };

        case "identify_trends":
          const trends = {
            seasonalTrends: [] as any[],
            cropTrends: [] as any[],
            costTrends: [] as any[],
            recommendations: [] as string[]
          };

          // Analyze monthly trends
          const monthlyTrendsData = filteredEntries.reduce((acc, entry) => {
            const month = (entry as any).date?.substring(5, 7) || '';
            if (!acc[month]) acc[month] = { entries: 0, cost: 0, harvests: 0 };
            acc[month].entries++;
            acc[month].cost += (entry as any).cost || 0;
            if ((entry as any).type === 'harvest') acc[month].harvests++;
            return acc;
          }, {} as Record<string, any>);

          trends.seasonalTrends = Object.entries(monthlyTrendsData).map(([month, data]) => ({
            month,
            entries: data.entries,
            cost: data.cost,
            harvests: data.harvests
          }));

          // Analyze crop trends
          const cropTypesForTrends = [...new Set(filteredEntries.map(entry => (entry as any).crop).filter(Boolean))];
          cropTypesForTrends.forEach(crop => {
            const cropEntriesForTrends = filteredEntries.filter(entry => (entry as any).crop === crop);
            const harvestCount = cropEntriesForTrends.filter(entry => (entry as any).type === 'harvest').length;
            const totalCost = cropEntriesForTrends.reduce((sum, entry) => sum + ((entry as any).cost || 0), 0);
            
            trends.cropTrends.push({
              crop,
              entries: cropEntriesForTrends.length,
              harvests: harvestCount,
              totalCost,
              successRate: cropEntriesForTrends.length > 0 ? (harvestCount / cropEntriesForTrends.length) * 100 : 0
            });
          });

          return { success: true, trends };

        case "generate_recommendations":
          const recommendations = {
            productivity: [] as string[],
            cost: [] as string[],
            weather: [] as string[],
            crop: [] as string[],
            general: [] as string[]
          };

          // Analyze data for recommendations
          const totalEntriesForRecs = filteredEntries.length;
          const harvestEntriesForRecs = filteredEntries.filter(entry => (entry as any).type === 'harvest').length;
          const totalCostForRecs = filteredEntries.reduce((sum, entry) => sum + ((entry as any).cost || 0), 0);

          // Productivity recommendations
          if (harvestEntriesForRecs < totalEntriesForRecs * 0.3) {
            recommendations.productivity.push("Increase harvest monitoring and activities");
          }
          if (totalCostForRecs > totalEntriesForRecs * 500) {
            recommendations.cost.push("Review and optimize cost management");
          }

          // Weather recommendations
          const weatherEntriesForRecs = filteredEntries.filter(entry => (entry as any).type === 'weather');
          if (weatherEntriesForRecs.length > 0) {
            recommendations.weather.push("Implement regular crop health monitoring");
            recommendations.weather.push("Optimize irrigation schedule based on weather patterns");
          }

          // Crop recommendations
          const cropTypesForRecs = [...new Set(filteredEntries.map(entry => (entry as any).crop).filter(Boolean))];
          if (cropTypesForRecs.length > 3) {
            recommendations.crop.push("Consider crop rotation for better soil health");
          }

          // General recommendations
          if (weatherEntriesForRecs.length < totalEntriesForRecs * 0.1) {
            recommendations.general.push("Invest in weather monitoring equipment");
          }

          return { success: true, recommendations };

        case "analyze_seasonal_patterns":
          const seasonalPatterns = {
            monthlyData: {} as Record<string, any>,
            seasonalTrends: [] as any[],
            recommendations: []
          };

          // Analyze monthly patterns
          const monthlyData = filteredEntries.reduce((acc, entry) => {
            const month = (entry as any).date?.substring(5, 7) || '';
            if (!acc[month]) acc[month] = { entries: 0, cost: 0, harvests: 0, weather: 0 };
            acc[month].entries++;
            acc[month].cost += (entry as any).cost || 0;
            if ((entry as any).type === 'harvest') acc[month].harvests++;
            if ((entry as any).type === 'weather') acc[month].weather++;
            return acc;
          }, {} as Record<string, any>);

          seasonalPatterns.monthlyData = monthlyData;

          // Identify seasonal trends
          Object.entries(monthlyData).forEach(([month, data]) => {
            const monthNum = parseInt(month);
            const season = getSeason(monthNum);
            
            seasonalPatterns.seasonalTrends.push({
              month,
              season,
              entries: data.entries,
              cost: data.cost,
              harvests: data.harvests,
              weather: data.weather
            });
          });

          return { success: true, seasonalPatterns };

        case "calculate_roi":
          const roiAnalysis = {
            totalInvestment: 0,
            totalRevenue: 0,
            netProfit: 0,
            roi: 0,
            breakdown: {} as Record<string, any>,
            recommendations: [] as string[]
          };

          // Calculate ROI
          roiAnalysis.totalInvestment = filteredEntries.reduce((sum, entry) => sum + ((entry as any).cost || 0), 0);
          const harvestEntriesForROI = filteredEntries.filter(entry => (entry as any).type === 'harvest');
          roiAnalysis.totalRevenue = harvestEntriesForROI.reduce((sum, entry) => sum + ((entry as any).revenue || 0), 0);
          
          roiAnalysis.netProfit = roiAnalysis.totalRevenue - roiAnalysis.totalInvestment;
          roiAnalysis.roi = roiAnalysis.totalInvestment > 0 ? 
            (roiAnalysis.netProfit / roiAnalysis.totalInvestment) * 100 : 0;

          // ROI breakdown by crop
          const cropTypesForROI = [...new Set(filteredEntries.map(entry => (entry as any).crop).filter(Boolean))];
          cropTypesForROI.forEach(crop => {
            const cropEntriesForROI = filteredEntries.filter(entry => (entry as any).crop === crop);
            const cropInvestment = cropEntriesForROI.reduce((sum, entry) => sum + ((entry as any).cost || 0), 0);
            const cropHarvests = cropEntriesForROI.filter(entry => (entry as any).type === 'harvest');
            const cropRevenue = cropHarvests.reduce((sum, entry) => sum + ((entry as any).revenue || 0), 0);
            
            roiAnalysis.breakdown[crop] = {
              investment: cropInvestment,
              revenue: cropRevenue,
              profit: cropRevenue - cropInvestment,
              roi: cropInvestment > 0 ? ((cropRevenue - cropInvestment) / cropInvestment) * 100 : 0
            };
          });

          // Generate recommendations
          if (roiAnalysis.roi < 20) {
            roiAnalysis.recommendations.push("Consider optimizing crop selection for better returns");
            roiAnalysis.recommendations.push("Review cost management strategies");
          }

          return { success: true, roiAnalysis };

        case "risk_assessment":
          const riskAssessment = {
            highRiskFactors: [] as string[],
            mediumRiskFactors: [] as string[],
            lowRiskFactors: [] as string[],
            recommendations: [] as string[]
          };

          // Analyze risks
          const totalEntriesForRisk = filteredEntries.length;
          const weatherEntriesForRisk = filteredEntries.filter(entry => (entry as any).type === 'weather');
          const totalCostForRisk = filteredEntries.reduce((sum, entry) => sum + ((entry as any).cost || 0), 0);
          const pestEntriesForRisk = filteredEntries.filter(entry => (entry as any).type === 'pest');

          // High risk factors
          if (weatherEntriesForRisk.length > totalEntriesForRisk * 0.3) {
            riskAssessment.highRiskFactors.push("Extreme weather events detected");
          }
          if (totalCostForRisk > totalEntriesForRisk * 1000) {
            riskAssessment.highRiskFactors.push("High operational costs detected");
          }

          // Medium risk factors
          if (pestEntriesForRisk.length > 0) {
            riskAssessment.mediumRiskFactors.push("High pest pressure detected");
          }

          // Generate recommendations
          if (riskAssessment.highRiskFactors.length > 0) {
            riskAssessment.recommendations.push("Implement risk mitigation strategies");
            riskAssessment.recommendations.push("Consider crop insurance");
          }

          return { success: true, riskAssessment };

        case "opportunity_analysis":
          const opportunityAnalysis = {
            opportunities: [] as string[],
            marketPotential: {} as Record<string, any>,
            recommendations: []
          };

          // Analyze opportunities
          const cropTypesForOpp = [...new Set(filteredEntries.map(entry => (entry as any).crop).filter(Boolean))];
          const harvestEntriesForOpp = filteredEntries.filter(entry => (entry as any).type === 'harvest');

          // Market opportunities
          if (harvestEntriesForOpp.length > 0) {
            opportunityAnalysis.opportunities.push("Expand market presence and sales activities");
          }

          // Crop-specific opportunities
          cropTypesForOpp.forEach(crop => {
            const cropEntriesForOpp = filteredEntries.filter(entry => (entry as any).crop === crop);
            const harvestCount = cropEntriesForOpp.filter(entry => (entry as any).type === 'harvest').length;
            
            if (harvestCount > 0) {
              opportunityAnalysis.marketPotential[crop] = {
                harvestCount,
                successRate: cropEntriesForOpp.length > 0 ? (harvestCount / cropEntriesForOpp.length) * 100 : 0,
                potential: harvestCount * 100 // kg potential
              };
            }
          });

          return { success: true, opportunityAnalysis };

        case "compare_periods":
          if (!startDate || !endDate) {
            throw new Error("startDate and endDate are required for period comparison");
          }

          const periodComparison = {
            period1: { startDate, endDate, data: {} },
            period2: { startDate: "", endDate: "", data: {} },
            differences: {},
            recommendations: []
          };

          // This would typically compare two different periods
          // For now, we'll analyze the current period
          const periodEntries = filteredEntries;
          const periodHarvests = periodEntries.filter(entry => (entry as any).type === 'harvest').length;
          const periodCost = periodEntries.reduce((sum, entry) => sum + ((entry as any).cost || 0), 0);

          periodComparison.period1.data = {
            totalEntries: periodEntries.length,
            harvests: periodHarvests,
            totalCost: periodCost,
            successRate: periodEntries.length > 0 ? (periodHarvests / periodEntries.length) * 100 : 0
          };

          return { success: true, periodComparison };

        case "generate_forecast":
          const forecast = {
            nextMonth: {} as Record<string, any>,
            nextQuarter: {} as Record<string, any>,
            nextYear: {} as Record<string, any>,
            confidence: 0,
            factors: [] as string[]
          };

          // Simple forecasting based on historical data
          const totalEntriesForForecast = filteredEntries.length;
          const harvestEntriesForForecast = filteredEntries.filter(entry => (entry as any).type === 'harvest').length;
          const totalCostForForecast = filteredEntries.reduce((sum, entry) => sum + ((entry as any).cost || 0), 0);

          // Next month forecast
          forecast.nextMonth = {
            predictedEntries: Math.round(totalEntriesForForecast * 0.8),
            predictedHarvests: Math.round(harvestEntriesForForecast * 0.8),
            predictedCost: Math.round(totalCostForForecast * 0.8)
          };

          // Next quarter forecast
          forecast.nextQuarter = {
            predictedEntries: Math.round(totalEntriesForForecast * 2.4),
            predictedHarvests: Math.round(harvestEntriesForForecast * 2.4),
            predictedCost: Math.round(totalCostForForecast * 2.4)
          };

          // Next year forecast
          forecast.nextYear = {
            predictedEntries: Math.round(totalEntriesForForecast * 9.6),
            predictedHarvests: Math.round(harvestEntriesForForecast * 9.6),
            predictedCost: Math.round(totalCostForForecast * 9.6)
          };

          forecast.confidence = Math.min(85, 50 + totalEntriesForForecast);
          forecast.factors = ["Historical data", "Seasonal patterns", "Crop performance"];

          return { success: true, forecast };

        case "benchmark_analysis":
          if (!benchmarkData) {
            throw new Error("benchmarkData is required for benchmark analysis");
          }

          const benchmark = {
            userMetrics: {} as Record<string, any>,
            benchmarkMetrics: benchmarkData,
            performanceGap: {} as Record<string, any>,
            recommendations: [] as string[]
          };

          // Calculate user metrics
          const totalEntriesForBenchmark = filteredEntries.length;
          const totalCostForBenchmark = filteredEntries.reduce((sum, entry) => sum + ((entry as any).cost || 0), 0);
          const harvestEntriesForBenchmark = filteredEntries.filter(entry => (entry as any).type === 'harvest').length;

          benchmark.userMetrics = {
            totalEntries: totalEntriesForBenchmark,
            totalCost: totalCostForBenchmark,
            harvestCount: harvestEntriesForBenchmark,
            averageCostPerEntry: totalEntriesForBenchmark > 0 ? totalCostForBenchmark / totalEntriesForBenchmark : 0,
            harvestRate: totalEntriesForBenchmark > 0 ? (harvestEntriesForBenchmark / totalEntriesForBenchmark) * 100 : 0
          };

          // Calculate performance gaps
          if (benchmarkData.averageCostPerEntry) {
            const costGap = benchmark.userMetrics.averageCostPerEntry - benchmarkData.averageCostPerEntry;
            benchmark.performanceGap.cost = {
              gap: costGap,
              percentage: benchmarkData.averageCostPerEntry > 0 ? (costGap / benchmarkData.averageCostPerEntry) * 100 : 0
            };
          }

          // Generate recommendations based on gaps
          if (benchmark.performanceGap.cost?.gap > 0) {
            benchmark.recommendations.push("Optimize cost management to match industry benchmarks");
          }

          return { success: true, benchmark };

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

// Helper functions
function generateWeatherRecommendations(weatherType: string): string[] {
  const recommendations: Record<string, string[]> = {
    'rainy': [
      'Ensure proper drainage systems',
      'Protect crops from waterlogging',
      'Delay irrigation activities'
    ],
    'sunny': [
      'Increase irrigation frequency',
      'Monitor soil moisture levels',
      'Protect crops from heat stress'
    ],
    'cloudy': [
      'Monitor for fungal diseases',
      'Ensure adequate ventilation',
      'Continue normal irrigation schedule'
    ],
    'windy': [
      'Secure crop supports',
      'Protect young seedlings',
      'Avoid spraying activities'
    ]
  };
  
  return recommendations[weatherType] || ['Monitor weather conditions closely'];
}

function generateYieldRecommendations(cropName: string, predictedYield: number): string[] {
  const recommendations = [];
  
  if (predictedYield < 800) {
    recommendations.push(`Increase irrigation for ${cropName}`);
    recommendations.push(`Apply additional fertilizer for ${cropName}`);
    recommendations.push(`Monitor for pests and diseases in ${cropName}`);
  } else if (predictedYield > 1200) {
    recommendations.push(`Excellent conditions for ${cropName}`);
    recommendations.push(`Consider expanding ${cropName} cultivation`);
  }
  
  return recommendations;
}

function getSeason(month: number): string {
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
} 