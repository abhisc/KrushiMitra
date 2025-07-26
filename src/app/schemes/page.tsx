"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
	Loader2,
	Landmark,
	FileText,
	Users,
	User,
	AlertCircle,
	CheckCircle,
	Search,
	Filter,
} from "lucide-react";
import AppLayout from "@/components/agrimitra/app-layout";
import { useAuth } from "@/contexts/auth-context";

interface Scheme {
	id: string;
	fields: {
		schemeName: string;
		schemeShortTitle: string;
		briefDescription: string;
		schemeCategory: string[];
		beneficiaryState: string[];
		level: string;
		schemeFor: string;
		nodalMinistryName: string;
		tags: string[];
		slug: string;
	};
}

export default function SchemesPage() {
	const [isLoading, setIsLoading] = useState(false);
	const [schemes, setSchemes] = useState<Scheme[]>([]);
	const [filteredSchemes, setFilteredSchemes] = useState<Scheme[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [activeTab, setActiveTab] = useState("all");
	const { toast } = useToast();
	const { userProfile } = useAuth();

	// Filter schemes when search query changes
	useEffect(() => {
		if (searchQuery.trim()) {
			const filtered = schemes.filter(
				(scheme) =>
					scheme.fields.schemeName
						.toLowerCase()
						.includes(searchQuery.toLowerCase()) ||
					scheme.fields.briefDescription
						.toLowerCase()
						.includes(searchQuery.toLowerCase()) ||
					scheme.fields.tags.some((tag) =>
						tag.toLowerCase().includes(searchQuery.toLowerCase()),
					),
			);
			setFilteredSchemes(filtered);
		} else {
			setFilteredSchemes(schemes);
		}
	}, [searchQuery, schemes]);

	const fetchAllSchemes = async () => {
		setIsLoading(true);
		try {
			// Try using a CORS proxy or different approach
			const response = await fetch(
				`https://api.myscheme.gov.in/search/v5/schemes?lang=en&q=%5B%7B%22identifier%22%3A%22schemeCategory%22%2C%22value%22%3A%22Agriculture%2CRural%20%26%20Environment%22%7D%5D&keyword=${searchQuery}&sort=&from=0&size=10`,
				{
					method: "GET",
					headers: {
						Accept: "application/json",
						"Content-Type": "application/json",
						"x-api-key": "tYTy5eEhlu9rFjyxuCr7ra7ACp4dv1RH8gWuHTDc",
					},
					mode: "cors",
				},
			);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();

			// Extract schemes from the response - based on the actual API response structure
			let schemesData: Scheme[] = [];
			if (data.data && data.data.hits && data.data.hits.items) {
				schemesData = data.data.hits.items;
			} else if (data.hits && data.hits.items) {
				schemesData = data.hits.items;
			} else if (data.data && Array.isArray(data.data)) {
				schemesData = data.data;
			} else if (data.schemes && Array.isArray(data.schemes)) {
				schemesData = data.schemes;
			} else if (Array.isArray(data)) {
				schemesData = data;
			}

			setSchemes(schemesData);
			setFilteredSchemes(schemesData);

			toast({
				title: "Schemes Loaded",
				description: `Successfully loaded ${schemesData.length} government schemes.`,
			});
		} catch (error) {
			console.error("Error fetching schemes:", error);
			toast({
				title: "Error",
				description: "Failed to load schemes. Please try again.",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const filterBasedOnUserData = () => {
		if (!userProfile) {
			toast({
				title: "No Profile Data",
				description: "Please complete your profile to use this filter.",
				variant: "destructive",
			});
			return;
		}

		const userFilters: string[] = [];

		// Filter based on user location
		if (userProfile.location?.state) {
			userFilters.push(userProfile.location.state);
		}

		// Filter based on user characteristics
		if (userProfile.caste) {
			userFilters.push(userProfile.caste);
		}
		if (userProfile.residence) {
			userFilters.push(userProfile.residence);
		}
		if (userProfile.gender) {
			userFilters.push(userProfile.gender);
		}

		const filtered = schemes.filter((scheme) => {
			// Check if scheme is applicable to user's state
			const isStateApplicable =
				scheme.fields.beneficiaryState.includes("All") ||
				scheme.fields.beneficiaryState.some(
					(state) =>
						userProfile.location?.state &&
						state
							.toLowerCase()
							.includes(userProfile.location.state.toLowerCase()),
				);

			// Check if scheme tags match user characteristics
			const hasMatchingTags = scheme.fields.tags.some((tag) =>
				userFilters.some((filter) =>
					tag.toLowerCase().includes(filter.toLowerCase()),
				),
			);

			return isStateApplicable || hasMatchingTags;
		});

		setFilteredSchemes(filtered);
		setActiveTab("user-data");

		toast({
			title: "Filtered by Profile",
			description: `Found ${filtered.length} schemes matching your profile.`,
		});
	};

	const filterBasedOnPrompt = async (prompt: string) => {
		if (!prompt.trim()) {
			toast({
				title: "Empty Prompt",
				description: "Please enter a search prompt.",
				variant: "destructive",
			});
			return;
		}

		const filtered = schemes.filter((scheme) => {
			const searchText =
				`${scheme.fields.schemeName} ${scheme.fields.briefDescription} ${scheme.fields.tags.join(" ")}`.toLowerCase();
			const promptLower = prompt.toLowerCase();

			// Simple keyword matching - in a real app, you might use AI for semantic search
			const keywords = promptLower.split(" ").filter((word) => word.length > 2);
			return keywords.some((keyword) => searchText.includes(keyword));
		});

		setFilteredSchemes(filtered);
		setActiveTab("prompt");

		toast({
			title: "Filtered by Prompt",
			description: `Found ${filtered.length} schemes matching "${prompt}".`,
		});
	};

	const resetFilters = () => {
		setFilteredSchemes(schemes);
		setSearchQuery("");
		setActiveTab("all");
	};

	return (
		<AppLayout
			title="Government Schemes"
			subtitle="Browse and filter government schemes for farmers"
			showBackButton={true}
		>
			<div className="p-6">
				<div className="max-w-6xl mx-auto space-y-6">
					{/* Header with search and filters */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Landmark className="w-5 h-5" />
								All Government Schemes
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{/* Search Bar */}
							<div className="flex">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
								<Input
									placeholder="Search schemes by name, description, or tags..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="pl-10 mr-4"
								/>
								<Button
									disabled={!searchQuery}
									className="w-[10vw] text-lg"
									onClick={() => fetchAllSchemes()}
								>
									Search
								</Button>
							</div>

							{/* Filter Options */}
							<Tabs
								value={activeTab}
								onValueChange={setActiveTab}
								className="w-full"
							>
								<TabsList className="grid w-full grid-cols-3">
									<TabsTrigger value="all">All Schemes</TabsTrigger>
									<TabsTrigger value="user-data">Filter by My Data</TabsTrigger>
									<TabsTrigger value="prompt">Filter by Prompt</TabsTrigger>
								</TabsList>

								<TabsContent value="all" className="space-y-4">
									<div className="flex items-center justify-between">
										<p className="text-sm text-gray-600">
											Showing all available government schemes
										</p>
										<Button variant="outline" size="sm" onClick={resetFilters}>
											Reset Filters
										</Button>
									</div>
								</TabsContent>

								<TabsContent value="user-data" className="space-y-4">
									<div className="space-y-4">
										{userProfile ? (
											<div className="bg-blue-50 p-4 rounded-lg">
												<h4 className="font-medium text-blue-800 mb-2">
													Your Profile Data:
												</h4>
												<div className="grid grid-cols-2 gap-2 text-sm">
													<div>
														<span className="font-medium">State:</span>{" "}
														{userProfile.location?.state || "Not set"}
													</div>
													<div>
														<span className="font-medium">Caste:</span>{" "}
														{userProfile.caste || "Not set"}
													</div>
													<div>
														<span className="font-medium">Residence:</span>{" "}
														{userProfile.residence || "Not set"}
													</div>
													<div>
														<span className="font-medium">Gender:</span>{" "}
														{userProfile.gender || "Not set"}
													</div>
												</div>
											</div>
										) : (
											<div className="bg-yellow-50 p-4 rounded-lg">
												<p className="text-yellow-800 text-sm">
													No profile data available. Complete your profile for
													personalized filtering.
												</p>
											</div>
										)}
										<Button
											onClick={filterBasedOnUserData}
											disabled={!userProfile}
											className="w-full"
										>
											<Filter className="w-4 h-4 mr-2" />
											Filter Based on My Data
										</Button>
									</div>
								</TabsContent>

								<TabsContent value="prompt" className="space-y-4">
									<div className="space-y-4">
										<div>
											<Label htmlFor="prompt">Enter your search prompt</Label>
											<Input
												id="prompt"
												placeholder="e.g., schemes for small farmers, women farmers, organic farming..."
												onKeyPress={(e) => {
													if (e.key === "Enter") {
														const target = e.target as HTMLInputElement;
														filterBasedOnPrompt(target.value);
													}
												}}
											/>
										</div>
										<Button
											onClick={() => {
												const promptInput = document.getElementById(
													"prompt",
												) as HTMLInputElement;
												filterBasedOnPrompt(promptInput.value);
											}}
											className="w-full"
										>
											<Search className="w-4 h-4 mr-2" />
											Filter Based on Prompt
										</Button>
									</div>
								</TabsContent>
							</Tabs>
						</CardContent>
					</Card>

					{/* Loading State */}
					{isLoading && (
						<Card>
							<CardContent className="flex items-center justify-center py-8">
								<Loader2 className="w-6 h-6 animate-spin mr-2" />
								<span>Loading schemes...</span>
							</CardContent>
						</Card>
					)}

					{/* Schemes List */}
					{!isLoading && (
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Users className="w-5 h-5" />
									Available Schemes ({filteredSchemes.length})
								</CardTitle>
							</CardHeader>
							<CardContent>
								{filteredSchemes.length === 0 ? (
									<div className="text-center py-8 text-gray-500">
										<FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
										<p>No schemes found matching your criteria.</p>
										<Button
											variant="outline"
											onClick={resetFilters}
											className="mt-4"
										>
											Reset Filters
										</Button>
									</div>
								) : (
									<div className="space-y-4">
										{filteredSchemes.map((scheme, index) => (
											<div
												key={scheme.id}
												className="border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow"
											>
												<div className="flex items-start justify-between">
													<div className="flex-1">
														<h3 className="font-semibold text-lg text-green-700">
															{scheme.fields.schemeName}
														</h3>
														{scheme.fields.schemeShortTitle && (
															<p className="text-sm text-gray-600 font-medium">
																{scheme.fields.schemeShortTitle}
															</p>
														)}
													</div>
													<div className="flex flex-col items-end gap-2">
														<span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
															{scheme.fields.level}
														</span>
														<span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
															{scheme.fields.schemeFor}
														</span>
													</div>
												</div>

												<p className="text-gray-600 text-sm leading-relaxed">
													{scheme.fields.briefDescription}
												</p>

												<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
													<div className="space-y-2">
														<div className="bg-blue-50 p-3 rounded-lg">
															<span className="font-medium text-blue-800">
																Ministry:
															</span>
															<p className="text-blue-700 mt-1">
																{scheme.fields.nodalMinistryName}
															</p>
														</div>
														<div className="bg-green-50 p-3 rounded-lg">
															<span className="font-medium text-green-800">
																Categories:
															</span>
															<p className="text-green-700 mt-1">
																{scheme.fields.schemeCategory.join(", ")}
															</p>
														</div>
													</div>
													<div className="space-y-2">
														<div className="bg-orange-50 p-3 rounded-lg">
															<span className="font-medium text-orange-800">
																Applicable States:
															</span>
															<p className="text-orange-700 mt-1">
																{scheme.fields.beneficiaryState.join(", ")}
															</p>
														</div>
														{scheme.fields.tags.length > 0 && (
															<div className="bg-purple-50 p-3 rounded-lg">
																<span className="font-medium text-purple-800">
																	Tags:
																</span>
																<div className="flex flex-wrap gap-1 mt-1">
																	{scheme.fields.tags.map((tag, tagIndex) => (
																		<span
																			key={tagIndex}
																			className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded"
																		>
																			{tag}
																		</span>
																	))}
																</div>
															</div>
														)}
													</div>
												</div>
											</div>
										))}
									</div>
								)}
							</CardContent>
						</Card>
					)}
				</div>
			</div>
		</AppLayout>
	);
}
// (async () => {
// 	const fetchMoreSchemeData = async (slug?: string) => {
// 		const response = fetch(
// 			`https://api.myscheme.gov.in/schemes/v5/public/schemes?slug=pm-kisan&lang=en`,
// 			{
// 				headers: {
// 					accept: "application/json, text/plain, */*",
// 					"accept-language": "en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7,hi;q=0.6",
// 					priority: "u=1, i",
// 					"sec-ch-ua":
// 						'"Opera";v="120", "Not-A.Brand";v="8", "Chromium";v="135"',
// 					"sec-ch-ua-mobile": "?0",
// 					"sec-ch-ua-platform": '"macOS"',
// 					"sec-fetch-dest": "empty",
// 					"sec-fetch-mode": "cors",
// 					"sec-fetch-site": "same-site",
// 					"x-api-key": "tYTy5eEhlu9rFjyxuCr7ra7ACp4dv1RH8gWuHTDc",
// 				},
// 				referrerPolicy: "same-origin",
// 				body: null,
// 				method: "GET",
// 			},
// 		);

// 		console.log("response", response);
// 		// type ResponseType = {
// 		// 	_id: string;
// 		// 	en: {
// 		// 		basicDetails: {
// 		// 			dbtScheme: boolean;
// 		// 			tags: string[];
// 		// 			schemeName: string;
// 		// 			schemeShortTitle: string;
// 		// 			level: {
// 		// 				value: string;
// 		// 				label: string;
// 		// 			};
// 		// 			schemeType: {
// 		// 				value: string;
// 		// 				label: string;
// 		// 			};
// 		// 			schemeCategory: Array<{
// 		// 				value: string;
// 		// 				label: string;
// 		// 			}>;
// 		// 			schemeSubCategory: Array<{
// 		// 				value: string;
// 		// 				label: string;
// 		// 			}>;
// 		// 			schemeOpenDate: string;
// 		// 			targetBeneficiaries: Array<{
// 		// 				value: string;
// 		// 				label: string;
// 		// 			}>;
// 		// 			nodalMinistryName: {
// 		// 				value: number;
// 		// 				label: string;
// 		// 			};
// 		// 			nodalDepartmentName: {
// 		// 				value: number;
// 		// 				label: string;
// 		// 			};
// 		// 			schemeFor: string;
// 		// 		};
// 		// 		schemeContent: {
// 		// 			references: Array<{
// 		// 				title: string;
// 		// 				url: string;
// 		// 			}>;
// 		// 			schemeImageUrl: string;
// 		// 			detailedDescription_md: string;
// 		// 			benefits_md: string;
// 		// 			exclusions_md: string;
// 		// 			briefDescription: string;
// 		// 			detailedDescription: Array<TextNode>;
// 		// 			benefitTypes: {
// 		// 				value: string;
// 		// 				label: string;
// 		// 			};
// 		// 			benefits: Array<TextNode>;
// 		// 			exclusions: Array<TextNode>;
// 		// 		};
// 		// 		applicationProcess: Array<{
// 		// 			mode: string;
// 		// 			url: string;
// 		// 			process: Array<TextNode>;
// 		// 			process_md: string;
// 		// 		}>;
// 		// 		schemeDefinitions: Array<{
// 		// 			name: string;
// 		// 			definition: Array<TextNode>;
// 		// 			source: string;
// 		// 			definitions_md: string;
// 		// 		}>;
// 		// 		eligibilityCriteria: {
// 		// 			eligibilityDescription_md: string;
// 		// 			eligibilityDescription: Array<TextNode>;
// 		// 		};
// 		// 	};
// 		// 	slug: string;
// 		// };

// 		// type TextNode = {
// 		// 	type: string;
// 		// 	children: Array<{
// 		// 		text: string;
// 		// 		bold?: boolean;
// 		// 	}>;
// 		// };
// 	};
// 	console.log(await fetchMoreSchemeData());
// })();
