import { defineTool } from "@genkit-ai/ai";
import { z } from "zod";
import { db } from "@/firebaseStore/firebase";
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
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

export const journalAnalyticsTool = defineTool({
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
  handler: async ({ 
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
          entry.date >= startDate && entry.date <= endDate
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
          const totalEntries = filteredEntries.length;
          const harvestEntries = filteredEntries.filter(entry => entry.type === 'harvest').length;
          const costEntries = filteredEntries.filter(entry => entry.cost).length;
          const totalCost = filteredEntries.reduce((sum, entry) => sum + (entry.cost || 0), 0);

          insights.productivityScore = totalEntries > 0 ? (harvestEntries / totalEntries) * 100 : 0;
          insights.costEfficiency = costEntries > 0 ? (totalCost / costEntries) : 0;

          // Analyze crop performance
          const crops = [...new Set(filteredEntries.map(entry => entry.crop).filter(Boolean))];
          crops.forEach(crop => {
            const cropEntries = filteredEntries.filter(entry => entry.crop === crop);
            const cropCost = cropEntries.reduce((sum, entry) => sum + (entry.cost || 0), 0);
            const cropHarvests = cropEntries.filter(entry => entry.type === 'harvest').length;
            
            insights.cropPerformance[crop] = {
              totalEntries: cropEntries.length,
              totalCost: cropCost,
              harvestCount: cropHarvests,
              successRate: cropEntries.length > 0 ? (cropHarvests / cropEntries.length) * 100 : 0
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

          const cropEntries = filteredEntries.filter(entry => entry.crop === cropName);
          const cropAnalysis: CropAnalysis = {
            cropName,
            totalEntries: cropEntries.length,
            totalCost: cropEntries.reduce((sum, entry) => sum + (entry.cost || 0), 0),
            averageCostPerEntry: 0,
            successRate: 0,
            seasonalPattern: [],
            yieldEstimate: 0,
            profitMargin: 0
          };

          cropAnalysis.averageCostPerEntry = cropEntries.length > 0 ? 
            cropAnalysis.totalCost / cropEntries.length : 0;

          const harvestEntries = cropEntries.filter(entry => entry.type === 'harvest');
          cropAnalysis.successRate = cropEntries.length > 0 ? 
            (harvestEntries.length / cropEntries.length) * 100 : 0;

          // Analyze seasonal patterns
          const monthlyData = cropEntries.reduce((acc, entry) => {
            const month = entry.date?.substring(5, 7) || '';
            if (!acc[month]) acc[month] = { entries: 0, cost: 0 };
            acc[month].entries++;
            acc[month].cost += entry.cost || 0;
            return acc;
          }, {} as Record<string, any>);

          cropAnalysis.seasonalPattern = Object.entries(monthlyData).map(([month, data]) => ({
            month,
            entries: data.entries,
            cost: data.cost
          }));

          // Estimate yield based on harvest entries
          cropAnalysis.yieldEstimate = harvestEntries.length * 100; // Simplified estimation

          return { success: true, cropAnalysis };

        case "analyze_weather_impact":
          const weatherEntries = filteredEntries.filter(entry => entry.type === 'weather');
          const weatherAnalysis: WeatherAnalysis[] = [];

          const weatherTypes = [...new Set(weatherEntries.map(entry => entry.weather).filter(Boolean))];
          
          weatherTypes.forEach(weatherType => {
            const typeEntries = weatherEntries.filter(entry => entry.weather === weatherType);
            const affectedCrops = [...new Set(typeEntries.map(entry => entry.crop).filter(Boolean))];
            
            weatherAnalysis.push({
              weatherType,
              frequency: typeEntries.length,
              impactOnCrops: affectedCrops,
              costImplications: typeEntries.reduce((sum, entry) => sum + (entry.cost || 0), 0),
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
          financialAnalysis.totalInvestment = filteredEntries.reduce((sum, entry) => sum + (entry.cost || 0), 0);

          // Estimate revenue from harvest entries
          const harvestEntries = filteredEntries.filter(entry => entry.type === 'harvest');
          financialAnalysis.totalRevenue = harvestEntries.length * 500; // Simplified estimation

          financialAnalysis.netProfit = financialAnalysis.totalRevenue - financialAnalysis.totalInvestment;
          financialAnalysis.profitMargin = financialAnalysis.totalRevenue > 0 ? 
            (financialAnalysis.netProfit / financialAnalysis.totalRevenue) * 100 : 0;

          // Cost breakdown by type
          const costByType = filteredEntries.reduce((acc, entry) => {
            if (entry.cost) {
              acc[entry.type] = (acc[entry.type] || 0) + entry.cost;
            }
            return acc;
          }, {} as Record<string, number>);

          financialAnalysis.costBreakdown = costByType;

          // Revenue by crop
          const crops = [...new Set(filteredEntries.map(entry => entry.crop).filter(Boolean))];
          crops.forEach(crop => {
            const cropHarvests = filteredEntries.filter(entry => 
              entry.crop === crop && entry.type === 'harvest'
            ).length;
            financialAnalysis.revenueByCrop[crop] = cropHarvests * 500; // Simplified estimation
          });

          // Monthly trends
          const monthlyTrends = filteredEntries.reduce((acc, entry) => {
            const month = entry.date?.substring(0, 7) || '';
            if (!acc[month]) acc[month] = { investment: 0, revenue: 0 };
            acc[month].investment += entry.cost || 0;
            if (entry.type === 'harvest') acc[month].revenue += 500; // Simplified estimation
            return acc;
          }, {} as Record<string, any>);

          financialAnalysis.monthlyTrends = Object.entries(monthlyTrends).map(([month, data]) => ({
            month,
            investment: data.investment,
            revenue: data.revenue,
            profit: data.revenue - data.investment
          }));

          // Calculate ROI
          financialAnalysis.roi = financialAnalysis.totalInvestment > 0 ? 
            (financialAnalysis.netProfit / financialAnalysis.totalInvestment) * 100 : 0;

          return { success: true, financialAnalysis };

        case "generate_productivity_report":
          const productivityReport = {
            totalActivities: filteredEntries.length,
            activityBreakdown: {},
            productivityScore: 0,
            efficiencyMetrics: {},
            improvementAreas: [],
            bestPractices: []
          };

          // Activity breakdown by type
          const activityBreakdown = filteredEntries.reduce((acc, entry) => {
            acc[entry.type] = (acc[entry.type] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          productivityReport.activityBreakdown = activityBreakdown;

          // Calculate productivity score
          const harvestCount = activityBreakdown['harvest'] || 0;
          const managementCount = activityBreakdown['crop management'] || 0;
          const irrigationCount = activityBreakdown['irrigation'] || 0;

          productivityReport.productivityScore = filteredEntries.length > 0 ? 
            ((harvestCount + managementCount + irrigationCount) / filteredEntries.length) * 100 : 0;

          // Efficiency metrics
          productivityReport.efficiencyMetrics = {
            harvestEfficiency: harvestCount > 0 ? (harvestCount / filteredEntries.length) * 100 : 0,
            managementEfficiency: managementCount > 0 ? (managementCount / filteredEntries.length) * 100 : 0,
            irrigationEfficiency: irrigationCount > 0 ? (irrigationCount / filteredEntries.length) * 100 : 0
          };

          // Identify improvement areas
          if (productivityReport.efficiencyMetrics.harvestEfficiency < 20) {
            productivityReport.improvementAreas.push("Increase harvest activities and yield monitoring");
          }
          if (productivityReport.efficiencyMetrics.managementEfficiency < 30) {
            productivityReport.improvementAreas.push("Enhance crop management practices");
          }

          return { success: true, productivityReport };

        case "predict_yield":
          if (!cropName) {
            throw new Error("cropName is required for yield prediction");
          }

          const cropEntries = filteredEntries.filter(entry => entry.crop === cropName);
          const harvestEntries = cropEntries.filter(entry => entry.type === 'harvest');
          const irrigationEntries = cropEntries.filter(entry => entry.type === 'irrigation');
          const fertilizerEntries = cropEntries.filter(entry => entry.type === 'fertilizer');

          // Simple yield prediction model
          const baseYield = 1000; // kg per acre
          const irrigationBonus = irrigationEntries.length * 50;
          const fertilizerBonus = fertilizerEntries.length * 30;
          const weatherBonus = cropEntries.filter(entry => entry.weather === 'sunny').length * 20;
          const weatherPenalty = cropEntries.filter(entry => entry.weather === 'rainy').length * 10;

          const predictedYield = baseYield + irrigationBonus + fertilizerBonus + weatherBonus - weatherPenalty;

          const yieldPrediction = {
            cropName,
            predictedYield,
            confidence: 0.75,
            factors: {
              irrigation: irrigationBonus,
              fertilizer: fertilizerBonus,
              weather: weatherBonus - weatherPenalty
            },
            recommendations: generateYieldRecommendations(cropName, predictedYield)
          };

          return { success: true, yieldPrediction };

        case "identify_trends":
          const trends = {
            activityTrends: {},
            costTrends: {},
            cropTrends: {},
            seasonalTrends: {}
          };

          // Activity trends by month
          const monthlyActivities = filteredEntries.reduce((acc, entry) => {
            const month = entry.date?.substring(0, 7) || '';
            if (!acc[month]) acc[month] = {};
            acc[month][entry.type] = (acc[month][entry.type] || 0) + 1;
            return acc;
          }, {} as Record<string, any>);

          trends.activityTrends = monthlyActivities;

          // Cost trends
          const monthlyCosts = filteredEntries.reduce((acc, entry) => {
            const month = entry.date?.substring(0, 7) || '';
            if (!acc[month]) acc[month] = 0;
            acc[month] += entry.cost || 0;
            return acc;
          }, {} as Record<string, number>);

          trends.costTrends = monthlyCosts;

          // Crop trends
          const cropTrends = filteredEntries.reduce((acc, entry) => {
            if (entry.crop) {
              if (!acc[entry.crop]) acc[entry.crop] = {};
              const month = entry.date?.substring(0, 7) || '';
              acc[entry.crop][month] = (acc[entry.crop][month] || 0) + 1;
            }
            return acc;
          }, {} as Record<string, any>);

          trends.cropTrends = cropTrends;

          return { success: true, trends };

        case "generate_recommendations":
          const recommendations = {
            immediate: [],
            shortTerm: [],
            longTerm: [],
            priority: []
          };

          const totalEntries = filteredEntries.length;
          const harvestEntries = filteredEntries.filter(entry => entry.type === 'harvest');
          const costEntries = filteredEntries.filter(entry => entry.cost);
          const totalCost = filteredEntries.reduce((sum, entry) => sum + (entry.cost || 0), 0);

          // Immediate recommendations
          if (harvestEntries.length < totalEntries * 0.2) {
            recommendations.immediate.push("Increase harvest monitoring and activities");
          }
          if (totalCost > 10000) {
            recommendations.immediate.push("Review and optimize cost management");
          }

          // Short-term recommendations
          recommendations.shortTerm.push("Implement regular crop health monitoring");
          recommendations.shortTerm.push("Optimize irrigation schedule based on weather patterns");

          // Long-term recommendations
          recommendations.longTerm.push("Consider crop rotation for better soil health");
          recommendations.longTerm.push("Invest in weather monitoring equipment");

          // Priority recommendations
          recommendations.priority = recommendations.immediate.slice(0, 3);

          return { success: true, recommendations };

        case "analyze_seasonal_patterns":
          const seasonalPatterns = {
            monthlyActivity: {},
            seasonalCrops: {},
            weatherPatterns: {},
            costSeasonality: {}
          };

          // Monthly activity patterns
          const monthlyActivity = filteredEntries.reduce((acc, entry) => {
            const month = parseInt(entry.date?.substring(5, 7) || '1');
            if (!acc[month]) acc[month] = {};
            acc[month][entry.type] = (acc[month][entry.type] || 0) + 1;
            return acc;
          }, {} as Record<number, any>);

          seasonalPatterns.monthlyActivity = monthlyActivity;

          // Seasonal crop patterns
          const seasonalCrops = filteredEntries.reduce((acc, entry) => {
            if (entry.crop) {
              const month = parseInt(entry.date?.substring(5, 7) || '1');
              const season = getSeason(month);
              if (!acc[season]) acc[season] = {};
              acc[season][entry.crop] = (acc[season][entry.crop] || 0) + 1;
            }
            return acc;
          }, {} as Record<string, any>);

          seasonalPatterns.seasonalCrops = seasonalCrops;

          return { success: true, seasonalPatterns };

        case "calculate_roi":
          const totalInvestment = filteredEntries.reduce((sum, entry) => sum + (entry.cost || 0), 0);
          const harvestEntries = filteredEntries.filter(entry => entry.type === 'harvest');
          const estimatedRevenue = harvestEntries.length * 500; // Simplified estimation

          const roi = {
            totalInvestment,
            estimatedRevenue,
            netProfit: estimatedRevenue - totalInvestment,
            roiPercentage: totalInvestment > 0 ? ((estimatedRevenue - totalInvestment) / totalInvestment) * 100 : 0,
            roiByCrop: {},
            roiByPeriod: {}
          };

          // ROI by crop
          const crops = [...new Set(filteredEntries.map(entry => entry.crop).filter(Boolean))];
          crops.forEach(crop => {
            const cropEntries = filteredEntries.filter(entry => entry.crop === crop);
            const cropInvestment = cropEntries.reduce((sum, entry) => sum + (entry.cost || 0), 0);
            const cropHarvests = cropEntries.filter(entry => entry.type === 'harvest').length;
            const cropRevenue = cropHarvests * 500;
            
            roi.roiByCrop[crop] = {
              investment: cropInvestment,
              revenue: cropRevenue,
              profit: cropRevenue - cropInvestment,
              roi: cropInvestment > 0 ? ((cropRevenue - cropInvestment) / cropInvestment) * 100 : 0
            };
          });

          return { success: true, roi };

        case "risk_assessment":
          const risks = {
            weatherRisks: [],
            financialRisks: [],
            cropRisks: [],
            operationalRisks: [],
            overallRiskScore: 0
          };

          // Weather risks
          const weatherEntries = filteredEntries.filter(entry => entry.type === 'weather');
          const extremeWeather = weatherEntries.filter(entry => 
            entry.weather === 'storm' || entry.weather === 'drought'
          );
          if (extremeWeather.length > 0) {
            risks.weatherRisks.push("Extreme weather events detected");
          }

          // Financial risks
          const totalCost = filteredEntries.reduce((sum, entry) => sum + (entry.cost || 0), 0);
          if (totalCost > 15000) {
            risks.financialRisks.push("High operational costs detected");
          }

          // Crop risks
          const pestEntries = filteredEntries.filter(entry => entry.type === 'pest control');
          if (pestEntries.length > 5) {
            risks.cropRisks.push("High pest pressure detected");
          }

          // Calculate overall risk score
          let riskScore = 0;
          if (risks.weatherRisks.length > 0) riskScore += 25;
          if (risks.financialRisks.length > 0) riskScore += 25;
          if (risks.cropRisks.length > 0) riskScore += 25;
          if (risks.operationalRisks.length > 0) riskScore += 25;

          risks.overallRiskScore = riskScore;

          return { success: true, risks };

        case "opportunity_analysis":
          const opportunities = {
            marketOpportunities: [],
            efficiencyOpportunities: [],
            costSavings: [],
            yieldImprovements: []
          };

          // Market opportunities
          const salesEntries = filteredEntries.filter(entry => entry.type === 'sales');
          if (salesEntries.length < 3) {
            opportunities.marketOpportunities.push("Expand market presence and sales activities");
          }

          // Efficiency opportunities
          const irrigationEntries = filteredEntries.filter(entry => entry.type === 'irrigation');
          if (irrigationEntries.length > 10) {
            opportunities.efficiencyOpportunities.push("Consider automated irrigation systems");
          }

          // Cost savings
          const fertilizerEntries = filteredEntries.filter(entry => entry.type === 'fertilizer');
          if (fertilizerEntries.length > 5) {
            opportunities.costSavings.push("Consider organic alternatives for cost reduction");
          }

          // Yield improvements
          const harvestEntries = filteredEntries.filter(entry => entry.type === 'harvest');
          if (harvestEntries.length < 5) {
            opportunities.yieldImprovements.push("Implement better crop management practices");
          }

          return { success: true, opportunities };

        case "compare_periods":
          if (!startDate || !endDate) {
            throw new Error("startDate and endDate are required for period comparison");
          }

          // Split the date range into two periods for comparison
          const midDate = new Date((new Date(startDate).getTime() + new Date(endDate).getTime()) / 2);
          const period1End = midDate.toISOString().split('T')[0];
          const period2Start = new Date(midDate.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

          const period1Entries = filteredEntries.filter(entry => 
            entry.date >= startDate && entry.date <= period1End
          );
          const period2Entries = filteredEntries.filter(entry => 
            entry.date >= period2Start && entry.date <= endDate
          );

          const comparison = {
            period1: {
              entries: period1Entries.length,
              totalCost: period1Entries.reduce((sum, entry) => sum + (entry.cost || 0), 0),
              harvestCount: period1Entries.filter(entry => entry.type === 'harvest').length
            },
            period2: {
              entries: period2Entries.length,
              totalCost: period2Entries.reduce((sum, entry) => sum + (entry.cost || 0), 0),
              harvestCount: period2Entries.filter(entry => entry.type === 'harvest').length
            },
            changes: {
              entriesChange: ((period2Entries.length - period1Entries.length) / period1Entries.length) * 100,
              costChange: period1Entries.length > 0 ? 
                ((period2Entries.reduce((sum, entry) => sum + (entry.cost || 0), 0) - 
                  period1Entries.reduce((sum, entry) => sum + (entry.cost || 0), 0)) / 
                  period1Entries.reduce((sum, entry) => sum + (entry.cost || 0), 0)) * 100 : 0,
              harvestChange: period1Entries.length > 0 ? 
                ((period2Entries.filter(entry => entry.type === 'harvest').length - 
                  period1Entries.filter(entry => entry.type === 'harvest').length) / 
                  period1Entries.filter(entry => entry.type === 'harvest').length) * 100 : 0
            }
          };

          return { success: true, comparison };

        case "generate_forecast":
          const forecast = {
            nextMonthPrediction: {},
            seasonalForecast: {},
            costForecast: {},
            yieldForecast: {}
          };

          // Simple forecasting based on historical patterns
          const monthlyPatterns = filteredEntries.reduce((acc, entry) => {
            const month = entry.date?.substring(5, 7) || '';
            if (!acc[month]) acc[month] = { entries: 0, cost: 0, harvests: 0 };
            acc[month].entries++;
            acc[month].cost += entry.cost || 0;
            if (entry.type === 'harvest') acc[month].harvests++;
            return acc;
          }, {} as Record<string, any>);

          // Predict next month based on average
          const avgEntries = Object.values(monthlyPatterns).reduce((sum: number, data: any) => sum + data.entries, 0) / Object.keys(monthlyPatterns).length;
          const avgCost = Object.values(monthlyPatterns).reduce((sum: number, data: any) => sum + data.cost, 0) / Object.keys(monthlyPatterns).length;
          const avgHarvests = Object.values(monthlyPatterns).reduce((sum: number, data: any) => sum + data.harvests, 0) / Object.keys(monthlyPatterns).length;

          forecast.nextMonthPrediction = {
            expectedEntries: Math.round(avgEntries),
            expectedCost: Math.round(avgCost),
            expectedHarvests: Math.round(avgHarvests)
          };

          return { success: true, forecast };

        case "benchmark_analysis":
          if (!benchmarkData) {
            throw new Error("benchmarkData is required for benchmark analysis");
          }

          const benchmark = {
            userMetrics: {},
            benchmarkMetrics: benchmarkData,
            performanceGap: {},
            recommendations: []
          };

          // Calculate user metrics
          const totalEntries = filteredEntries.length;
          const totalCost = filteredEntries.reduce((sum, entry) => sum + (entry.cost || 0), 0);
          const harvestEntries = filteredEntries.filter(entry => entry.type === 'harvest').length;

          benchmark.userMetrics = {
            totalEntries,
            totalCost,
            harvestCount: harvestEntries,
            averageCostPerEntry: totalEntries > 0 ? totalCost / totalEntries : 0,
            harvestRate: totalEntries > 0 ? (harvestEntries / totalEntries) * 100 : 0
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
});

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