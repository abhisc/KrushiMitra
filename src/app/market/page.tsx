"use client";

import { BarChart3, Loader2, PieChart, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Legend,
	Line,
	LineChart,
	Pie,
	PieChart as RechartsPieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import {
	getMarketAnalysis,
	type MarketAnalysisInput,
} from "@/ai/flows/real-time-market-analysis";
import AppLayout from "@/components/agrimitra/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import stateNames from "@/constants/stateNames";
import { fetchDataFromGovtAPI } from "@/helpers/govtData/fetchGovtData";
import { govtResources, ResourcesEnum } from "@/helpers/govtData/resources";
import { useToast } from "@/hooks/use-toast";

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
	const [state, setState] = useState("");
	const [market, setMarket] = useState("");
	const [moreDetails, setMoreDetails] = useState("");
	const [activeView, setActiveView] = useState<
		"analysis" | "charts" | "distribution"
	>("analysis");

	const [result, setResult] = useState<any>({});
	const [marketList, setMarketList] = useState<[] | string[]>([]);

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

	useEffect(() => {
		market && setMarket("");
		state &&
			fetchDataFromGovtAPI(ResourcesEnum.districts, {
				format: "json",
				limit: "100",
				offset: "0",
				"filters[State]": state,
				...(govtResources["districts"].queryDefault || {}),
			},
			'40',1)
				.then((data) => {
					const districts = (data?.records || [])?.reduce(
						(acc: string[], item: any) => {
							if (!acc.includes(item.District)) {
								acc.push(item.District);
							}
							return acc;
						},
						[],
					);

					setMarketList(districts);
				})
				.catch((error) => {
					console.error("Error fetching districts:", error);
					toast({
						title: "Error",
						description: "Failed to load districts. Please try again later.",
						variant: "destructive",
					});
				});
	}, [state]);

	const handleMarketAnalysis = async () => {
		setIsLoading(true);
		try {
			const input: MarketAnalysisInput = {
				state: state.trim(),
				market: market.trim(),
				moreDetails: moreDetails.trim(),
			};

			const analysis = await getMarketAnalysis(input);
			setResult(analysis);

			toast({
				title: "Analysis Complete",
				description: `Market analysis for ${state} in ${market} completed.`,
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
			subtitle="Get latest prices and market trends for agricultural products"
			showBackButton={true}
		>
			<div className="p-2">
				<div className="max-w-4xl mx-auto space-y-3">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<TrendingUp className="w-5 h-5" />
								Market Analysis Parameters
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
								<div>
									<Label htmlFor="state">State</Label>
									<Select value={state} onValueChange={setState}>
										<SelectTrigger>
											<SelectValue placeholder="State" />
										</SelectTrigger>
										<SelectContent>
											{stateNames.map((state) => (
												<SelectItem key={state} value={state}>
													{state}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div>
									<Label htmlFor="market">APMC</Label>
									<Select value={market} onValueChange={setMarket}>
										<SelectTrigger>
											<SelectValue placeholder="Select market" />
										</SelectTrigger>
										<SelectContent>
											{marketList.map((marketName) => (
												<SelectItem key={marketName} value={marketName}>
													{marketName}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div className="md:col-span-2">
									<Label htmlFor="custom-market">Specific Requirements</Label>
									<Input
										id="more_details"
										placeholder="Enter any additional details"
										value={moreDetails}
										onChange={(e) => setMoreDetails(e.target.value)}
									/>
								</div>
							</div>
							<Button
								onClick={handleMarketAnalysis}
								disabled={isLoading || !(moreDetails || state || market)}
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
