"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
	getMarketplaceSearch,
	MarketplaceSearchInput,
} from "@/ai/flows/farming-marketplace";
import { 
	Loader2, 
	Search, 
	Phone, 
	MapPin, 
	Star, 
	CheckCircle, 
	Truck, 
	Package,
	Building2,
	Store,
	Shield
} from "lucide-react";
import AppLayout from "@/components/agrimitra/app-layout";
import stateNames from "@/constants/stateNames";

export default function MarketplacePage() {
	const [isLoading, setIsLoading] = useState(false);
	const [productType, setProductType] = useState("");
	const [productName, setProductName] = useState("");
	const [location, setLocation] = useState("");
	const [budget, setBudget] = useState("");
	const [requirements, setRequirements] = useState("");
	const [result, setResult] = useState<any>({});

	const { toast } = useToast();

	const productTypes = [
		{ value: "tractor", label: "Tractors & Farm Equipment" },
		{ value: "fertilizer", label: "Fertilizers & Nutrients" },
		{ value: "seeds", label: "Seeds & Planting Material" },
		{ value: "pesticides", label: "Pesticides & Crop Protection" },
		{ value: "tools", label: "Farm Tools & Implements" },
	];

	const sellerTypes = [
		{ value: "krushi-kendra", label: "Krushi Kendra (Govt)" },
		{ value: "local-dealer", label: "Local Dealer" },
		{ value: "authorized-distributor", label: "Authorized Distributor" },
	];

	const handleMarketplaceSearch = async () => {
		setIsLoading(true);
		try {
			const input: MarketplaceSearchInput = {
				productType: productType.trim(),
				productName: productName.trim(),
				location: location.trim(),
				budget: budget.trim(),
				requirements: requirements.trim(),
			};

			const searchResult = await getMarketplaceSearch(input);
			setResult(searchResult);

			toast({
				title: "Search Complete",
				description: `Found ${searchResult.totalResults} products for your search.`,
			});
		} catch (error) {
			console.error("Marketplace search error:", error);
			toast({
				title: "Search Failed",
				description: "Unable to search marketplace. Please try again.",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const getSellerIcon = (sellerType: string) => {
		switch (sellerType.toLowerCase()) {
			case "krushi kendra":
				return <Building2 className="w-4 h-4" />;
			case "local dealer":
				return <Store className="w-4 h-4" />;
			case "authorized distributor":
				return <Shield className="w-4 h-4" />;
			default:
				return <Store className="w-4 h-4" />;
		}
	};

	const getCertificationColor = (certification: string) => {
		if (certification.toLowerCase().includes("govt")) return "bg-green-100 text-green-800";
		if (certification.toLowerCase().includes("organic")) return "bg-blue-100 text-blue-800";
		if (certification.toLowerCase().includes("certified")) return "bg-purple-100 text-purple-800";
		return "bg-gray-100 text-gray-800";
	};

	const getStockColor = (stock: string) => {
		if (stock.toLowerCase().includes("available")) return "text-green-600";
		if (stock.toLowerCase().includes("limited")) return "text-orange-600";
		if (stock.toLowerCase().includes("request")) return "text-blue-600";
		return "text-gray-600";
	};

	return (
		<AppLayout
			title="Farming Marketplace"
			subtitle="Find, compare, and buy agricultural products from trusted sellers"
			showBackButton={true}
		>
			<div className="p-2">
				<div className="max-w-6xl mx-auto space-y-3">
					{/* Search Form */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Search className="w-5 h-5" />
								Search Agricultural Products
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								<div>
									<Label htmlFor="productType">Product Type</Label>
									<Select value={productType} onValueChange={setProductType}>
										<SelectTrigger>
											<SelectValue placeholder="Select product type" />
										</SelectTrigger>
										<SelectContent>
											{productTypes.map((type) => (
												<SelectItem key={type.value} value={type.value}>
													{type.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div>
									<Label htmlFor="productName">Product/Brand Name</Label>
									<Input
										id="productName"
										placeholder="e.g., Mahindra, John Deere, Urea"
										value={productName}
										onChange={(e) => setProductName(e.target.value)}
									/>
								</div>
								<div>
									<Label htmlFor="location">Location</Label>
									<Select value={location} onValueChange={setLocation}>
										<SelectTrigger>
											<SelectValue placeholder="Select state" />
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
									<Label htmlFor="budget">Budget Range</Label>
									<Input
										id="budget"
										placeholder="e.g., ₹5,00,000 - ₹7,00,000"
										value={budget}
										onChange={(e) => setBudget(e.target.value)}
									/>
								</div>
								<div className="md:col-span-2">
									<Label htmlFor="requirements">Additional Requirements</Label>
									<Input
										id="requirements"
										placeholder="e.g., Govt certified, delivery available, organic"
										value={requirements}
										onChange={(e) => setRequirements(e.target.value)}
									/>
								</div>
							</div>
							<Button
								onClick={handleMarketplaceSearch}
								disabled={isLoading || !productType}
								className="w-full"
							>
								{isLoading ? (
									<>
										<Loader2 className="w-4 h-4 mr-2 animate-spin" />
										Searching Products...
									</>
								) : (
									<>
										<Search className="w-4 h-4 mr-2" />
										Search Products
									</>
								)}
							</Button>
						</CardContent>
					</Card>

					{/* Search Results */}
					{!!result.overview && (
						<>
							{/* Overview */}
							<Card className="bg-gradient-to-r from-green-50 to-blue-50">
								<CardContent className="p-4">
									<div className="prose prose-sm text-gray-800">
										<h3 className="text-lg font-semibold mb-2">Search Overview</h3>
										<p>{result.overview}</p>
									</div>
								</CardContent>
							</Card>

							{/* Products List */}
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<Package className="w-5 h-5" />
										Available Products ({result.totalResults || result.products?.length || 0})
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									{result.products?.map((product: any, index: number) => (
										<div
											key={index}
											className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
										>
											<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
												{/* Product Info */}
												<div className="flex-1">
													<div className="flex items-start gap-3 mb-3">
														<div className="flex-1">
															<h3 className="text-xl font-bold text-gray-900 mb-1">
																{product.productName}
															</h3>
															<p className="text-gray-600 mb-2">
																{product.brand} • {product.model}
															</p>
															<div className="flex items-center gap-2 mb-2">
																<span className="text-2xl font-bold text-green-600">
																	{product.price}
																</span>
																{product.rating && (
																	<div className="flex items-center gap-1">
																		<Star className="w-4 h-4 text-yellow-500 fill-current" />
																		<span className="text-sm text-gray-600">
																			{product.rating}
																		</span>
																	</div>
																)}
															</div>
														</div>
													</div>

													{/* Seller Info */}
													<div className="flex items-center gap-2 mb-3">
														{getSellerIcon(product.sellerType)}
														<span className="text-sm font-medium text-gray-700">
															{product.sellerName}
														</span>
														<Badge variant="outline" className="text-xs">
															{product.sellerType}
														</Badge>
													</div>

													{/* Details Grid */}
													<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
														<div className="flex items-center gap-2">
															<CheckCircle className="w-4 h-4 text-green-600" />
															<span className={`text-sm font-medium ${getStockColor(product.stockAvailability)}`}>
																{product.stockAvailability}
															</span>
														</div>
														<div className="flex items-center gap-2">
															<Shield className="w-4 h-4 text-blue-600" />
															<Badge className={`text-xs ${getCertificationColor(product.certification)}`}>
																{product.certification}
															</Badge>
														</div>
														<div className="flex items-center gap-2">
															<Truck className="w-4 h-4 text-purple-600" />
															<span className="text-sm text-gray-700">
																{product.deliveryOptions}
															</span>
														</div>
														<div className="flex items-center gap-2">
															<Phone className="w-4 h-4 text-gray-600" />
															<span className="text-sm text-gray-700">
																{product.contactInfo}
															</span>
														</div>
													</div>
												</div>

												{/* Action Buttons */}
												<div className="flex flex-col gap-2 lg:flex-row lg:items-center">
													<Button
														variant="default"
														className="w-full lg:w-auto"
														onClick={() => {
															toast({
																title: "Action",
																description: `Initiating ${product.action} for ${product.productName}`,
															});
														}}
													>
														{product.action.includes("Buy") && "Buy Now"}
														{product.action.includes("Call") && "Call Seller"}
														{product.action.includes("Visit") && "Visit Store"}
													</Button>
													<Button
														variant="outline"
														className="w-full lg:w-auto"
														onClick={() => {
															toast({
																title: "Details",
																description: `Showing detailed information for ${product.productName}`,
															});
														}}
													>
														View Details
													</Button>
												</div>
											</div>
										</div>
									))}
								</CardContent>
							</Card>

							{/* Alternatives */}
							{result.alternatives && result.alternatives.length > 0 && (
								<Card>
									<CardHeader>
										<CardTitle className="flex items-center gap-2">
											<Package className="w-5 h-5" />
											Alternative Products
										</CardTitle>
									</CardHeader>
									<CardContent className="space-y-4">
										{result.alternatives.map((product: any, index: number) => (
											<div
												key={index}
												className="bg-gray-50 border border-gray-200 rounded-lg p-4"
											>
												<div className="flex items-center justify-between">
													<div>
														<h4 className="font-semibold text-gray-900">
															{product.productName}
														</h4>
														<p className="text-sm text-gray-600">
															{product.brand} • {product.price}
														</p>
													</div>
													<Button variant="outline" size="sm">
														View Details
													</Button>
												</div>
											</div>
										))}
									</CardContent>
								</Card>
							)}

							{/* Market Insights */}
							{result.marketInsights && (
								<Card className="bg-gradient-to-r from-blue-50 to-purple-50">
									<CardHeader>
										<CardTitle className="flex items-center gap-2">
											<MapPin className="w-5 h-5" />
											Market Insights & Recommendations
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="prose prose-sm text-gray-800">
											<p>{result.marketInsights}</p>
										</div>
									</CardContent>
								</Card>
							)}
						</>
					)}

					{/* Quick Search Examples */}
					{!result.overview && (
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Search className="w-5 h-5" />
									Quick Search Examples
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
									<Button
										variant="outline"
										onClick={() => {
											setProductType("tractor");
											setProductName("Mahindra");
											setLocation("Maharashtra");
											toast({
												title: "Quick Search",
												description: "Searching for Mahindra tractors in Maharashtra",
											});
										}}
										className="h-auto p-4 flex flex-col items-start gap-2"
									>
										<div className="font-semibold">Tractors</div>
										<div className="text-sm text-gray-600">
											Mahindra tractors in Maharashtra
										</div>
									</Button>
									<Button
										variant="outline"
										onClick={() => {
											setProductType("fertilizer");
											setProductName("Urea");
											setLocation("Karnataka");
											toast({
												title: "Quick Search",
												description: "Searching for Urea fertilizer in Karnataka",
											});
										}}
										className="h-auto p-4 flex flex-col items-start gap-2"
									>
										<div className="font-semibold">Fertilizers</div>
										<div className="text-sm text-gray-600">
											Urea fertilizer in Karnataka
										</div>
									</Button>
									<Button
										variant="outline"
										onClick={() => {
											setProductType("seeds");
											setProductName("Wheat");
											setLocation("Punjab");
											toast({
												title: "Quick Search",
												description: "Searching for Wheat seeds in Punjab",
											});
										}}
										className="h-auto p-4 flex flex-col items-start gap-2"
									>
										<div className="font-semibold">Seeds</div>
										<div className="text-sm text-gray-600">
											Wheat seeds in Punjab
										</div>
									</Button>
								</div>
							</CardContent>
						</Card>
					)}
				</div>
			</div>
		</AppLayout>
	);
} 