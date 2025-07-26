"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
	getMarketAnalysis,
	MarketAnalysisInput,
} from "@/ai/flows/real-time-market-analysis";
import { Loader2, TrendingUp, BarChart3, PieChart, MessageSquare } from "lucide-react";
import AppLayout from "@/components/agrimitra/app-layout";
import stateNames from "@/constants/stateNames";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	PieChart as RechartsPieChart,
	Cell,
	LineChart,
	Line,
	Legend,
	Pie,
} from "recharts";

const COLORS = [
	"#0088FE",
	"#00C49F",
	"#FFBB28",
	"#FF8042",
	"#8884D8",
	"#82CA9D",
];

export default function MarketPage() {
	const [isLoading, setIsLoading] = useState(false);
	const [userQuery, setUserQuery] = useState("");
	const [activeView, setActiveView] = useState<
		"analysis" | "charts" | "distribution"
	>("analysis");

	const [result, setResult] = useState<any>({});

	const { toast } = useToast();

	const ToggleScreenComponent = () => (
		<Card className="shadow-lg">
			<CardContent className="p-2">
				<div className="flex flex-wrap gap-2 justify-center">
					<Button
						variant={activeView === "analysis" ? "default" : "outline"}
						onClick={() => setActiveView("analysis")}
						className="flex items-center gap-2"
					>
						<BarChart3 className="w-4 h-4" />
						Market Analysis Result
					</Button>
					<Button
						variant={activeView === "charts" ? "default" : "outline"}
						onClick={() => setActiveView("charts")}
						className="flex items-center gap-2"
					>
						<TrendingUp className="w-4 h-4" />
						Price & Volume Analysis
					</Button>
					<Button
						variant={activeView === "distribution" ? "default" : "outline"}
						onClick={() => setActiveView("distribution")}
						className="flex items-center gap-2"
					>
						<PieChart className="w-4 h-4" />
						Market Entries Distribution
					</Button>
				</div>
			</CardContent>
		</Card>
	);

	// Function to extract information from natural language query
	const extractMarketInfo = (query: string) => {
		const lowerQuery = query.toLowerCase();
		let state = "";
		let market = "";
		let moreDetails = query; // Keep original query as details

		// Extract state information
		const states = stateNames.map(s => s.toLowerCase());
		for (const stateName of states) {
			if (lowerQuery.includes(stateName)) {
				state = stateNames[states.indexOf(stateName)];
				break;
			}
		}

		// Extract common district/market names that might be mentioned
		const commonMarkets = [
			"mumbai", "pune", "nashik", "aurangabad", "nagpur",
			"bangalore", "mysore", "hubli", "mangalore",
			"delhi", "gurgaon", "faridabad", "ghaziabad",
			"chandigarh", "ludhiana", "amritsar", "jalandhar",
			"chennai", "coimbatore", "madurai", "salem",
			"hyderabad", "vijayawada", "visakhapatnam",
			"kochi", "thiruvananthapuram", "calicut"
		];

		for (const marketName of commonMarkets) {
			if (lowerQuery.includes(marketName)) {
				market = marketName.charAt(0).toUpperCase() + marketName.slice(1);
				break;
			}
		}

		return { state, market, moreDetails };
	};

	const handleMarketAnalysis = async () => {
		if (!userQuery.trim()) {
			toast({
				title: "Input Required",
				description: "Please describe what market analysis you need.",
				variant: "destructive",
			});
			return;
		}

		setIsLoading(true);
		try {
			// Extract information from natural language query
			const { state, market, moreDetails } = extractMarketInfo(userQuery);

			const input: MarketAnalysisInput = {
				state: state,
				market: market,
				moreDetails: moreDetails,
			};

			const analysis = await getMarketAnalysis(input);
			setResult(analysis);

			toast({
				title: "Analysis Complete",
				description: "Market analysis completed successfully.",
			});
		} catch (error) {
			console.error("Market analysis error:", error);
			toast({
				title: "Analysis Failed",
				description: "Unable to get market analysis. Please try again.",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	// Add helper function to prepare chart data
	const prepareChartData = () => {
		if (!result.cropsData || result.cropsData.length === 0)
			return { priceData: [], trendData: [] };

		const priceData = result.cropsData.map((item: any) => ({
			name: item.crop,
			price: parseFloat(item.price.replace(/[^\d.]/g, "") || "0"),
			entries: parseInt(item.entries) || 0,
		}));

		const trendData = result.cropsData.map((item: any, index: number) => ({
			name: item.crop,
			value: parseInt(item.entries) || 0,
			fill: COLORS[index % COLORS.length],
		}));

		return { priceData, trendData };
	};

	const { priceData, trendData } = prepareChartData();

	return (
		<AppLayout
			title="Real-Time Market Analysis"
			subtitle="Describe your market analysis needs in natural language"
			showBackButton={true}
		>
			<div className="p-2">
				<div className="max-w-4xl mx-auto space-y-3">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<MessageSquare className="w-5 h-5" />
								Describe Your Market Analysis Needs
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<Label htmlFor="user-query" className="text-base font-medium">
									What market information do you need?
								</Label>
								<Textarea
									id="user-query"
									placeholder="Example: 'I want to know wheat prices in Punjab markets' or 'Show me rice market analysis for Maharashtra' or 'What are the current potato prices in UP and market trends?'"
									value={userQuery}
									onChange={(e) => setUserQuery(e.target.value)}
									className="min-h-[120px] mt-2"
									rows={5}
								/>
								<p className="text-sm text-gray-500 mt-2">
									💡 You can mention: crops/commodities, states, districts, price trends, market conditions, etc.
								</p>
							</div>
							<Button
								onClick={handleMarketAnalysis}
								disabled={isLoading || !userQuery.trim()}
								className="w-full"
							>
								{isLoading ? (
									<>
										<Loader2 className="w-4 h-4 mr-2 animate-spin" />
										Analyzing Market...
									</>
								) : (
									<>
										<BarChart3 className="w-4 h-4 mr-2" />
										Get Market Analysis
									</>
								)}
							</Button>
						</CardContent>
					</Card>

					{!!result.overview && (
						<>
							{/* Market Analysis Result View */}
							{activeView === "analysis" && (
								<Card className="shadow-lg">
									<ToggleScreenComponent />
									<CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 rounded-t-lg">
										<div className="prose prose-lg px-4 py-1 text-gray-800 leading-relaxed">
											{result.overview}
										</div>
									</CardHeader>
									<CardContent className="max-h-[42vh] overflow-auto py-4 space-y-4">
										{result.cropsData?.map((item: any, index: number) => (
											<div
												key={index}
												className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
											>
												<div className="flex items-center gap-3 mb-3">
													<div
														className={`w-3 h-3 rounded-full ${
															item.trend?.toLowerCase().includes("increas")
																? "bg-green-500"
																: item.trend?.toLowerCase().includes("decreas")
																	? "bg-red-500"
																	: "bg-yellow-500"
														}`}
													></div>
													<h2 className="text-2xl font-bold text-gray-800 capitalize">
														{item.crop}
													</h2>
												</div>

												<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
													<div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-lg border border-green-200">
														<h3 className="font-semibold text-lg text-green-800 mb-2 flex items-center gap-2">
															<TrendingUp className="w-4 h-4" />
															Current Price
														</h3>
														<p className="text-2xl font-bold text-green-700">
															₹{item.price}/quintal
														</p>
													</div>
													<div className="bg-gradient-to-br from-orange-50 to-orange-100 p-3 rounded-lg border border-orange-200">
														<h3 className="font-semibold text-lg text-orange-800 mb-2 flex items-center gap-2">
															<svg
																className="w-4 h-4"
																fill="none"
																stroke="currentColor"
																viewBox="0 0 24 24"
															>
																<path
																	strokeLinecap="round"
																	strokeLinejoin="round"
																	strokeWidth={2}
																	d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
																/>
															</svg>
															Market Entries
														</h3>
														<p className="text-xl font-bold text-orange-700">
															{item.entries} records found
														</p>
													</div>
													<div
														className={`p-3 rounded-lg border ${
															item.trend?.toLowerCase().includes("increasing")
																? "bg-gradient-to-br from-green-50 to-green-100 border-green-200"
																: item.trend
																			?.toLowerCase()
																			.includes("decreasing")
																	? "bg-gradient-to-br from-red-50 to-red-100 border-red-200"
																	: "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200"
														}`}
													>
														<h3
															className={`font-semibold text-lg mb-2 flex items-center gap-2 ${
																item.trend?.toLowerCase().includes("increasing")
																	? "text-green-800"
																	: item.trend
																				?.toLowerCase()
																				.includes("decreasing")
																		? "text-red-800"
																		: "text-blue-800"
															}`}
														>
															<BarChart3 className="w-4 h-4" />
															Price Trend
														</h3>
														<p
															className={`text-md font-medium ${
																item.trend?.toLowerCase().includes("increasing")
																	? "text-green-700"
																	: item.trend
																				?.toLowerCase()
																				.includes("decreasing")
																		? "text-red-700"
																		: "text-blue-700"
															}`}
														>
															{item.trend}
														</p>
													</div>
												</div>

												<div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
													<h4 className="font-semibold text-lg text-gray-800 mb-2 flex items-center gap-2">
														<svg
															className="w-4 h-4"
															fill="none"
															stroke="currentColor"
															viewBox="0 0 24 24"
														>
															<path
																strokeLinecap="round"
																strokeLinejoin="round"
																strokeWidth={2}
																d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
															/>
														</svg>
														{`${item.crop} Market Analysis`}
													</h4>
													<p className="text-gray-700 leading-relaxed">
														{item.analysis}
													</p>
												</div>
											</div>
										))}
									</CardContent>
								</Card>
							)}

							{/* Price & Volume Analysis View */}
							{activeView === "charts" && (
								<Card className="shadow-lg">
									<ToggleScreenComponent />
									<CardContent className="pt-8">
										<ResponsiveContainer width="100%" height={400}>
											<LineChart data={priceData}>
												<CartesianGrid strokeDasharray="3 3" />
												<XAxis dataKey="name" />
												<YAxis yAxisId="left" />
												<YAxis yAxisId="right" orientation="right" />
												<Tooltip />
												<Legend />
												<Bar
													yAxisId="right"
													dataKey="entries"
													fill="#82ca9d"
													name="Market Entries"
												/>
												<Line
													yAxisId="left"
													type="monotone"
													dataKey="price"
													stroke="#22c55e"
													strokeWidth={3}
													name="Price (₹/quintal)"
												/>
											</LineChart>
										</ResponsiveContainer>
									</CardContent>
								</Card>
							)}

							{/* Market Entries Distribution View */}
							{activeView === "distribution" && (
								<Card className="shadow-lg">
									<ToggleScreenComponent />
									<CardContent className="pt-8">
										{trendData.length > 0 ? (
											<ResponsiveContainer width="100%" height={450}>
												<RechartsPieChart>
													<Pie
														data={trendData}
														cx="50%"
														cy="50%"
														labelLine={false}
														label={({ name, percent }) =>
															percent > 0
																? `${name} ${(percent * 100).toFixed(0)}%`
																: ""
														}
														outerRadius={120}
														fill="#8884d8"
														dataKey="value"
													>
														{trendData.map((entry: any, index: number) => (
															<Cell key={`cell-${index}`} fill={entry.fill} />
														))}
													</Pie>
													<Tooltip
														formatter={(value, name) => [
															`${value} entries`,
															`${name}`,
														]}
													/>
													<Legend />
												</RechartsPieChart>
											</ResponsiveContainer>
										) : (
											<div className="flex items-center justify-center h-[300px] text-gray-500">
												No data available for chart
											</div>
										)}
									</CardContent>
								</Card>
							)}
						</>
					)}
				</div>
			</div>
		</AppLayout>
	);
}
