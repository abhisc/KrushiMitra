"use client";

import { useEffect, useState, useCallback } from "react";
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
	Shield,
	X,
	Calendar,
	Clock,
	Tag,
	User,
	Mail,
	Globe,
	FileText,
	Award,
	ShieldCheck,
	TruckIcon,
	CreditCard,
	AlertCircle
} from "lucide-react";
import AppLayout from "@/components/agrimitra/app-layout";
import stateNames from "@/constants/stateNames";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

export default function MarketplacePage() {
	const [isLoading, setIsLoading] = useState(false);
	const [productType, setProductType] = useState("");
	const [productName, setProductName] = useState("");
	const [location, setLocation] = useState("");
	const [budget, setBudget] = useState("");
	const [requirements, setRequirements] = useState("");
	const [result, setResult] = useState<any>({});
	const [selectedProduct, setSelectedProduct] = useState<any>(null);
	const [showDetailsDialog, setShowDetailsDialog] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const { toast } = useToast();

	// Keyboard shortcut for search (Enter)
	const handleKeyPress = useCallback((event: KeyboardEvent) => {
		if (event.key === 'Enter') {
			event.preventDefault();
			if (!isLoading && productType.trim() && location.trim()) {
				handleMarketplaceSearch();
			}
		}
	}, [isLoading, productType, location]);

	useEffect(() => {
		document.addEventListener('keydown', handleKeyPress);
		return () => {
			document.removeEventListener('keydown', handleKeyPress);
		};
	}, [handleKeyPress]);

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

	const resetAllStates = () => {
		setProductType("");
		setProductName("");
		setLocation("");
		setBudget("");
		setRequirements("");
		setResult({});
		setSelectedProduct(null);
		setShowDetailsDialog(false);
		setError(null);
	};

	const handleMarketplaceSearch = async () => {
		// Validate required fields
		if (!productType.trim()) {
			toast({
				title: "Validation Error",
				description: "Please select a product type.",
				variant: "destructive",
			});
			return;
		}

		if (!location.trim()) {
			toast({
				title: "Validation Error",
				description: "Please select a location.",
				variant: "destructive",
			});
			return;
		}

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
			
			// Validate search result
			if (!searchResult || !searchResult.products || searchResult.products.length === 0) {
				toast({
					title: "No Results Found",
					description: "No products found for your search criteria. Try adjusting your search parameters.",
					variant: "destructive",
				});
				setResult({});
				return;
			}

			setResult(searchResult);

			toast({
				title: "Search Complete",
				description: `Found ${searchResult.totalResults || searchResult.products.length} products for your search.`,
			});
		} catch (error) {
			console.error("Marketplace search error:", error);
			const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
			setError(errorMessage);
			toast({
				title: "Search Failed",
				description: "Unable to search marketplace. Please try again.",
				variant: "destructive",
			});
			setResult({});
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
		if (certification.toLowerCase().includes("iso")) return "bg-purple-100 text-purple-800";
		return "bg-gray-100 text-gray-800";
	};

	const getStockColor = (stock: string) => {
		if (stock.toLowerCase().includes("in stock")) return "bg-green-100 text-green-800";
		if (stock.toLowerCase().includes("limited")) return "bg-yellow-100 text-yellow-800";
		if (stock.toLowerCase().includes("out of stock")) return "bg-red-100 text-red-800";
		return "bg-gray-100 text-gray-800";
	};

	const handleViewDetails = (product: any) => {
		setSelectedProduct(product);
		setShowDetailsDialog(true);
	};

	const ProductDetailsDialog = () => {
		if (!selectedProduct) return null;

		// Generate mock detailed seller information based on seller type
		const getSellerDetails = (sellerType: string, sellerName: string) => {
			const baseDetails = {
				address: "",
				phone: selectedProduct.contactInfo,
				email: "",
				website: "",
				hours: "",
				established: "",
				services: [] as string[],
				paymentMethods: [] as string[],
				location: {
					latitude: "",
					longitude: "",
					area: ""
				}
			};

			// Type definitions for location data
			type LocationData = {
				address: string;
				latitude: string;
				longitude: string;
				area: string;
			};

			type StateLocations = {
				maharashtra: LocationData;
				punjab: LocationData;
				karnataka: LocationData;
				tamil_nadu: LocationData;
			};

			type SellerLocations = {
				"krushi kendra": StateLocations;
				"local dealer": StateLocations;
				"authorized distributor": StateLocations;
			};

			// Generate location based on seller type and name
			const getLocationData = (sellerType: string, sellerName: string): LocationData => {
				const locations: SellerLocations = {
					"krushi kendra": {
						maharashtra: {
							address: "Krushi Bhavan, Agricultural Complex, Main Road, Pune, Maharashtra 411001",
							latitude: "18.5204",
							longitude: "73.8567",
							area: "District Agricultural Office, Pune"
						},
						punjab: {
							address: "Krushi Bhavan, Agricultural Complex, Main Road, Ludhiana, Punjab 141001",
							latitude: "30.9010",
							longitude: "75.8573",
							area: "District Agricultural Office, Ludhiana"
						},
						karnataka: {
							address: "Krushi Bhavan, Agricultural Complex, Main Road, Bangalore, Karnataka 560001",
							latitude: "12.9716",
							longitude: "77.5946",
							area: "District Agricultural Office, Bangalore"
						},
						tamil_nadu: {
							address: "Krushi Bhavan, Agricultural Complex, Main Road, Chennai, Tamil Nadu 600001",
							latitude: "13.0827",
							longitude: "80.2707",
							area: "District Agricultural Office, Chennai"
						}
					},
					"local dealer": {
						maharashtra: {
							address: "Shop No. 45, Agricultural Market, Main Bazaar, Nashik, Maharashtra 422001",
							latitude: "19.9975",
							longitude: "73.7898",
							area: "Agricultural Market, Nashik"
						},
						punjab: {
							address: "Shop No. 23, Agricultural Market, Main Bazaar, Amritsar, Punjab 143001",
							latitude: "31.6340",
							longitude: "74.8723",
							area: "Agricultural Market, Amritsar"
						},
						karnataka: {
							address: "Shop No. 67, Agricultural Market, Main Bazaar, Mysore, Karnataka 570001",
							latitude: "12.2958",
							longitude: "76.6394",
							area: "Agricultural Market, Mysore"
						},
						tamil_nadu: {
							address: "Shop No. 89, Agricultural Market, Main Bazaar, Coimbatore, Tamil Nadu 641001",
							latitude: "11.0168",
							longitude: "76.9558",
							area: "Agricultural Market, Coimbatore"
						}
					},
					"authorized distributor": {
						maharashtra: {
							address: "Authorized Service Center, Industrial Area, Highway Road, Nagpur, Maharashtra 440001",
							latitude: "21.1458",
							longitude: "79.0882",
							area: "Industrial Zone, Nagpur"
						},
						punjab: {
							address: "Authorized Service Center, Industrial Area, Highway Road, Jalandhar, Punjab 144001",
							latitude: "31.3260",
							longitude: "75.5762",
							area: "Industrial Zone, Jalandhar"
						},
						karnataka: {
							address: "Authorized Service Center, Industrial Area, Highway Road, Hubli, Karnataka 580001",
							latitude: "15.3647",
							longitude: "75.1240",
							area: "Industrial Zone, Hubli"
						},
						tamil_nadu: {
							address: "Authorized Service Center, Industrial Area, Highway Road, Salem, Tamil Nadu 636001",
							latitude: "11.6643",
							longitude: "78.1460",
							area: "Industrial Zone, Salem"
						}
					}
				};

				// Determine state based on seller name or default to Maharashtra
				let state: keyof StateLocations = "maharashtra";
				if (sellerName.toLowerCase().includes("punjab") || sellerName.toLowerCase().includes("ludhiana") || sellerName.toLowerCase().includes("amritsar")) {
					state = "punjab";
				} else if (sellerName.toLowerCase().includes("karnataka") || sellerName.toLowerCase().includes("bangalore") || sellerName.toLowerCase().includes("mysore")) {
					state = "karnataka";
				} else if (sellerName.toLowerCase().includes("tamil") || sellerName.toLowerCase().includes("chennai") || sellerName.toLowerCase().includes("coimbatore")) {
					state = "tamil_nadu";
				}

				// Safely access location data with proper type checking
				const sellerTypeKey = sellerType.toLowerCase() as keyof SellerLocations;
				const sellerLocations = locations[sellerTypeKey];
				
				if (sellerLocations && sellerLocations[state]) {
					return sellerLocations[state];
				} else if (sellerLocations && sellerLocations.maharashtra) {
					return sellerLocations.maharashtra;
				} else {
					// Fallback to local dealer maharashtra
					return locations["local dealer"].maharashtra;
				}
			};

			const locationData = getLocationData(sellerType, sellerName);

			switch (sellerType.toLowerCase()) {
				case "krushi kendra":
					return {
						...baseDetails,
						address: locationData.address,
						email: `${sellerName.toLowerCase().replace(/\s+/g, '')}@krushikendra.gov.in`,
						website: "https://krushikendra.gov.in",
						hours: "Monday - Saturday: 9:00 AM - 6:00 PM\nSunday: 10:00 AM - 2:00 PM",
						established: "Government established",
						services: ["Subsidy distribution", "Technical support", "Training programs", "Quality testing"],
						paymentMethods: ["Cash", "UPI", "Bank transfer", "Subsidy schemes"],
						location: {
							latitude: locationData.latitude,
							longitude: locationData.longitude,
							area: locationData.area
						}
					};
				case "local dealer":
					return {
						...baseDetails,
						address: locationData.address,
						email: `${sellerName.toLowerCase().replace(/\s+/g, '')}@agridealer.com`,
						website: "https://agridealer.com",
						hours: "Monday - Sunday: 8:00 AM - 8:00 PM",
						established: "2015",
						services: ["Sales", "Service", "Spare parts", "Financing options"],
						paymentMethods: ["Cash", "UPI", "Credit/Debit cards", "EMI options"],
						location: {
							latitude: locationData.latitude,
							longitude: locationData.longitude,
							area: locationData.area
						}
					};
				case "authorized distributor":
					return {
						...baseDetails,
						address: locationData.address,
						email: `${sellerName.toLowerCase().replace(/\s+/g, '')}@authorized.com`,
						website: "https://authorized.com",
						hours: "Monday - Friday: 9:00 AM - 7:00 PM\nSaturday: 9:00 AM - 5:00 PM",
						established: "2010",
						services: ["Authorized sales", "Warranty service", "Technical support", "Training"],
						paymentMethods: ["Cash", "UPI", "Credit/Debit cards", "Corporate accounts"],
						location: {
							latitude: locationData.latitude,
							longitude: locationData.longitude,
							area: locationData.area
						}
					};
				default:
					return {
						...baseDetails,
						address: "Agricultural Equipment Store, Main Road, City",
						email: `${sellerName.toLowerCase().replace(/\s+/g, '')}@agri.com`,
						website: "https://agri.com",
						hours: "Monday - Saturday: 9:00 AM - 7:00 PM",
						established: "2020",
						services: ["Sales", "Service", "Support"],
						paymentMethods: ["Cash", "UPI", "Cards"],
						location: {
							latitude: "19.0760",
							longitude: "72.8777",
							area: "City Center"
						}
					};
			}
		};

		const sellerDetails = getSellerDetails(selectedProduct.sellerType, selectedProduct.sellerName);



		const handleViewLocation = () => {
			// Open Google Maps with seller's location
			const { latitude, longitude } = sellerDetails.location;
			const address = encodeURIComponent(sellerDetails.address);
			const mapUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
			window.open(mapUrl, '_blank');
			toast({
				title: "Opening Location",
				description: `Opening ${selectedProduct.sellerName} location on Google Maps`,
			});
		};

		const handleEmailSeller = () => {
			// Open email client with seller's email
			const subject = encodeURIComponent(`Inquiry about ${selectedProduct.productName}`);
			const body = encodeURIComponent(`Hello,\n\nI am interested in your ${selectedProduct.productName} (${selectedProduct.brand} ${selectedProduct.model}).\n\nCould you please provide more information about:\n- Availability\n- Pricing details\n- Delivery options\n- Warranty information\n\nThank you.`);
			const mailtoUrl = `mailto:${sellerDetails.email}?subject=${subject}&body=${body}`;
			window.open(mailtoUrl, '_blank');
			toast({
				title: "Emailing Seller",
				description: `Opening email client for ${selectedProduct.sellerName}`,
			});
		};

		const handleVisitWebsite = () => {
			// Open seller's website
			window.open(sellerDetails.website, '_blank');
			toast({
				title: "Opening Website",
				description: `Opening ${selectedProduct.sellerName} website`,
			});
		};

		const handleBuyNow = () => {
			// Open store location on Google Maps for in-store purchase
			const { latitude, longitude } = sellerDetails.location;
			const mapUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
			window.open(mapUrl, '_blank');
			toast({
				title: "Store Location",
				description: `Opening ${selectedProduct.sellerName} store location on Google Maps for purchase`,
			});
		};

		const handleContactSeller = () => {
			// Show comprehensive contact information
			const contactInfo = `
Contact ${selectedProduct.sellerName}:

📞 Phone: ${sellerDetails.phone}
📧 Email: ${sellerDetails.email}
🌐 Website: ${sellerDetails.website}
📍 Address: ${sellerDetails.address}
🕒 Hours: ${sellerDetails.hours}

You can also visit their store location or call them directly for inquiries.
			`;
			
			toast({
				title: "Contact Information",
				description: contactInfo,
				duration: 8000, // Show for 8 seconds to allow reading
			});
		};

		return (
			<Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
				<DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle className="text-2xl font-bold text-gray-900">
							{selectedProduct.productName}
						</DialogTitle>
						<DialogDescription className="text-lg text-gray-600">
							{selectedProduct.brand} {selectedProduct.model}
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-6">
						{/* Price and Rating Section */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border">
								<div className="flex items-center gap-3 mb-4">
									<Tag className="w-6 h-6 text-green-600" />
									<h3 className="text-xl font-bold text-gray-900">Pricing</h3>
								</div>
								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<span className="text-gray-600">Price:</span>
										<span className="text-2xl font-bold text-green-600">{selectedProduct.price}</span>
									</div>
									<div className="flex items-center gap-2">
										<span className="text-gray-600">Rating:</span>
										<div className="flex items-center gap-1">
											{Array.from({ length: 5 }).map((_, i) => (
												<Star
													key={i}
													className={`w-4 h-4 ${
														i < parseInt(selectedProduct.rating) 
															? "text-yellow-400 fill-current" 
															: "text-gray-300"
													}`}
												/>
											))}
										</div>
										<span className="text-sm text-gray-500">({selectedProduct.rating}/5)</span>
									</div>
								</div>
							</div>

							<div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border">
								<div className="flex items-center gap-3 mb-4">
									<Store className="w-6 h-6 text-blue-600" />
									<h3 className="text-xl font-bold text-gray-900">Seller Information</h3>
								</div>
								<div className="space-y-3">
									<div className="flex items-center gap-2">
										<User className="w-4 h-4 text-gray-500" />
										<span className="font-medium">{selectedProduct.sellerName}</span>
									</div>
									<div className="flex items-center gap-2">
										{getSellerIcon(selectedProduct.sellerType)}
										<span className="text-sm text-gray-600">{selectedProduct.sellerType}</span>
																						</div>


												</div>
							</div>
						</div>

						{/* Complete Seller Details */}
						<div className="bg-white border rounded-lg p-6">
							<h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
								<Building2 className="w-5 h-5" />
								Complete Seller Details
							</h3>
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
								{/* Contact Information */}
								<div className="space-y-4">
									<h4 className="font-semibold text-gray-800 mb-3">Contact Information</h4>
									<div className="space-y-3">
										<div className="flex items-start gap-3">
											<MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
											<div>
												<span className="text-sm text-gray-600">Address:</span>
												<p className="text-sm font-medium">{sellerDetails.address}</p>
											</div>
										</div>
										<div className="flex items-center gap-3">
											<Phone className="w-5 h-5 text-gray-500" />
											<div>
												<span className="text-sm text-gray-600">Phone:</span>
												<p className="text-sm font-medium">{sellerDetails.phone}</p>
											</div>
										</div>

										<div className="flex items-center gap-3">
											<Mail className="w-5 h-5 text-gray-500" />
											<div>
												<span className="text-sm text-gray-600">Email:</span>
												<p className="text-sm font-medium">{sellerDetails.email}</p>
											</div>
										</div>
										<div className="flex items-center gap-3">
											<Globe className="w-5 h-5 text-gray-500" />
											<div>
												<span className="text-sm text-gray-600">Website:</span>
												<p className="text-sm font-medium text-blue-600 hover:underline cursor-pointer" onClick={handleVisitWebsite}>
													{sellerDetails.website}
												</p>
											</div>
										</div>
									</div>
								</div>

								{/* Business Information */}
								<div className="space-y-4">
									<h4 className="font-semibold text-gray-800 mb-3">Business Information</h4>
									<div className="space-y-3">
										<div className="flex items-center gap-3">
											<Calendar className="w-5 h-5 text-gray-500" />
											<div>
												<span className="text-sm text-gray-600">Established:</span>
												<p className="text-sm font-medium">{sellerDetails.established}</p>
											</div>
										</div>
										<div className="flex items-start gap-3">
											<Clock className="w-5 h-5 text-gray-500 mt-0.5" />
											<div>
												<span className="text-sm text-gray-600">Business Hours:</span>
												<p className="text-sm font-medium whitespace-pre-line">{sellerDetails.hours}</p>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* Store Location & Services */}
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
							{/* Store Location */}
							<div className="bg-gradient-to-r from-purple-50 to-pink-50 border rounded-lg p-6">
								<h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
									<MapPin className="w-5 h-5 text-purple-600" />
									Store Location
								</h4>
								<div className="space-y-3">
									<div className="bg-white rounded-lg p-4 border">
										<div className="flex items-center justify-between mb-2">
											<span className="text-sm font-medium text-gray-700">Area:</span>
											<span className="text-sm text-gray-600">{sellerDetails.location.area}</span>
										</div>
										<div className="flex items-center justify-between mb-2">
											<span className="text-sm font-medium text-gray-700">Coordinates:</span>
											<span className="text-sm text-gray-600">
												{sellerDetails.location.latitude}, {sellerDetails.location.longitude}
											</span>
										</div>
										<div className="mt-3">
											<Button variant="outline" size="sm" className="w-full" onClick={handleViewLocation}>
												<MapPin className="w-4 h-4 mr-2" />
												View on Map
											</Button>
										</div>
									</div>
								</div>
							</div>

							{/* Services & Payment */}
							<div className="bg-gradient-to-r from-green-50 to-blue-50 border rounded-lg p-6">
								<h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
									<Award className="w-5 h-5 text-green-600" />
									Services & Payment
								</h4>
								<div className="space-y-4">
									<div>
										<span className="text-sm font-medium text-gray-700">Services Offered:</span>
										<div className="flex flex-wrap gap-2 mt-2">
											{sellerDetails.services.map((service, index) => (
												<Badge key={index} variant="secondary" className="text-xs">
													{service}
												</Badge>
											))}
										</div>
									</div>
									<div>
										<span className="text-sm font-medium text-gray-700">Payment Methods:</span>
										<div className="flex flex-wrap gap-2 mt-2">
											{sellerDetails.paymentMethods.map((method, index) => (
												<Badge key={index} variant="outline" className="text-xs">
													{method}
												</Badge>
											))}
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* Product Specifications */}
						<div className="bg-white border rounded-lg p-6">
							<h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
								<FileText className="w-5 h-5" />
								Product Specifications
							</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<span className="text-gray-600">Brand:</span>
										<span className="font-medium">{selectedProduct.brand}</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-gray-600">Model:</span>
										<span className="font-medium">{selectedProduct.model}</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-gray-600">Stock Status:</span>
										<Badge className={getStockColor(selectedProduct.stockAvailability)}>
											{selectedProduct.stockAvailability}
										</Badge>
									</div>
								</div>
								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<span className="text-gray-600">Certification:</span>
										<Badge className={getCertificationColor(selectedProduct.certification)}>
											{selectedProduct.certification}
										</Badge>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-gray-600">Delivery:</span>
										<span className="font-medium">{selectedProduct.deliveryOptions}</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-gray-600">Action:</span>
										<span className="font-medium text-blue-600">{selectedProduct.action}</span>
									</div>
								</div>
							</div>
						</div>

						{/* Additional Features */}
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
								<div className="flex items-center gap-2 mb-2">
									<Award className="w-5 h-5 text-yellow-600" />
									<h4 className="font-semibold text-yellow-800">Quality Assurance</h4>
								</div>
								<p className="text-sm text-yellow-700">
									{selectedProduct.certification} certified product with quality guarantee
								</p>
							</div>

							<div className="bg-green-50 border border-green-200 rounded-lg p-4">
								<div className="flex items-center gap-2 mb-2">
									<TruckIcon className="w-5 h-5 text-green-600" />
									<h4 className="font-semibold text-green-800">Delivery Options</h4>
								</div>
								<p className="text-sm text-green-700">
									{selectedProduct.deliveryOptions}
								</p>
							</div>

							<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
								<div className="flex items-center gap-2 mb-2">
									<ShieldCheck className="w-5 h-5 text-blue-600" />
									<h4 className="font-semibold text-blue-800">Seller Reliability</h4>
								</div>
								<p className="text-sm text-blue-700">
									{selectedProduct.sellerType} with verified credentials
								</p>
							</div>
						</div>

						{/* Contact Information Card */}
						<div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
							<h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
								<Phone className="w-5 h-5 text-blue-600" />
								Contact Information
							</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-3">
									<div className="flex items-center gap-3">
										<Phone className="w-4 h-4 text-blue-600" />
										<div>
											<span className="text-sm text-gray-600">Phone:</span>
											<p className="font-medium">{sellerDetails.phone}</p>
										</div>
									</div>
									<div className="flex items-center gap-3">
										<Mail className="w-4 h-4 text-blue-600" />
										<div>
											<span className="text-sm text-gray-600">Email:</span>
											<p className="font-medium">{sellerDetails.email}</p>
										</div>
									</div>
								</div>
								<div className="space-y-3">
									<div className="flex items-center gap-3">
										<Globe className="w-4 h-4 text-blue-600" />
										<div>
											<span className="text-sm text-gray-600">Website:</span>
											<p className="font-medium">{sellerDetails.website}</p>
										</div>
									</div>
									<div className="flex items-center gap-3">
										<Clock className="w-4 h-4 text-blue-600" />
										<div>
											<span className="text-sm text-gray-600">Business Hours:</span>
											<p className="font-medium">{sellerDetails.hours}</p>
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* Action Buttons */}
						<div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
							<Button 
								className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold" 
								onClick={handleBuyNow}
							>
								<CreditCard className="w-4 h-4 mr-2" />
								Buy Now
							</Button>
							<Button 
								variant="outline"
								className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50" 
								onClick={handleContactSeller}
							>
								<Phone className="w-4 h-4 mr-2" />
								Contact Seller
							</Button>
						</div>



						{/* Important Notes */}
						<div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
							<div className="flex items-start gap-2">
								<AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
								<div>
									<h4 className="font-semibold text-orange-800 mb-1">Important Notes</h4>
									<ul className="text-sm text-orange-700 space-y-1">
										<li>• Verify product specifications before purchase</li>
										<li>• Check warranty and return policies</li>
										<li>• Confirm delivery timeline and costs</li>
										<li>• Verify seller credentials and reviews</li>
										<li>• Visit the store location during business hours</li>
										<li>• Keep all transaction receipts for warranty claims</li>
									</ul>
								</div>
							</div>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		);
	};

	return (
		<AppLayout
			title="Agricultural Marketplace"
			subtitle="Find tractors, fertilizers, seeds, and farming equipment"
			showBackButton={true}
		>
			<div className="p-2">
				<div className="max-w-6xl mx-auto space-y-3">
					{/* Search Form */}
					<Card id="search-form">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Search className="w-5 h-5" />
								Search Products
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								<div>
									<Label htmlFor="product-type">Product Type</Label>
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
									<Label htmlFor="product-name">Product/Brand Name</Label>
									<Input
										id="product-name"
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
							<div className="flex flex-col sm:flex-row gap-3">
								<Button
									onClick={handleMarketplaceSearch}
									disabled={isLoading || !productType.trim() || !location.trim()}
									className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
								>
									{isLoading ? (
										<>
											<Loader2 className="w-4 h-4 mr-2 animate-spin" />
											Searching...
										</>
									) : (
										<>
											<Search className="w-4 h-4 mr-2" />
											Search Products
										</>
									)}
								</Button>
								<Button
									variant="outline"
									onClick={resetAllStates}
									disabled={isLoading}
									className="px-6"
								>
									<X className="w-4 h-4 mr-2" />
									Clear All
								</Button>
							</div>
						</CardContent>
					</Card>

					{/* Error State */}
					{error && (
						<Card className="bg-gradient-to-r from-red-50 to-pink-50 border-red-200">
							<CardContent className="flex items-center justify-center py-8">
								<div className="text-center">
									<AlertCircle className="w-8 h-8 mx-auto mb-4 text-red-600" />
									<h3 className="text-lg font-semibold text-gray-800 mb-2">Search Error</h3>
									<p className="text-gray-600 mb-4">{error}</p>
									<Button 
										variant="outline" 
										onClick={() => {
											setError(null);
											setResult({});
										}}
										className="border-red-200 text-red-700 hover:bg-red-50"
									>
										<Search className="w-4 h-4 mr-2" />
										Try Again
									</Button>
								</div>
							</CardContent>
						</Card>
					)}

					{/* Loading State */}
					{isLoading && (
						<Card className="bg-gradient-to-r from-blue-50 to-purple-50">
							<CardContent className="flex items-center justify-center py-12">
								<div className="text-center">
									<Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
									<h3 className="text-lg font-semibold text-gray-800 mb-2">Searching Marketplace</h3>
									<p className="text-gray-600">Finding the best products for you...</p>
								</div>
							</CardContent>
						</Card>
					)}

					{/* Results */}
					{result.overview && !isLoading && (
						<>
							{/* Search Summary */}
							<Card className="bg-gradient-to-r from-green-50 to-blue-50">
								<CardHeader>
									<CardTitle className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<Search className="w-5 h-5" />
											Search Summary
										</div>
										<Button
											variant="outline"
											size="sm"
											onClick={() => {
												const searchForm = document.getElementById('search-form');
												if (searchForm) {
													searchForm.scrollIntoView({ behavior: 'smooth' });
												}
											}}
											className="text-xs"
										>
											<Search className="w-3 h-3 mr-1" />
											Back to Search
										</Button>
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div className="prose prose-sm text-gray-800">
											<p>{result.overview}</p>
										</div>
										<div className="bg-white rounded-lg p-4 border">
											<h4 className="font-semibold text-gray-800 mb-3">Search Criteria</h4>
											<div className="space-y-2 text-sm">
												<div className="flex justify-between">
													<span className="text-gray-600">Product Type:</span>
													<span className="font-medium">{productType || "Any"}</span>
												</div>
												<div className="flex justify-between">
													<span className="text-gray-600">Product Name:</span>
													<span className="font-medium">{productName || "Any"}</span>
												</div>
												<div className="flex justify-between">
													<span className="text-gray-600">Location:</span>
													<span className="font-medium">{location || "Any"}</span>
												</div>
												<div className="flex justify-between">
													<span className="text-gray-600">Budget:</span>
													<span className="font-medium">{budget || "Any"}</span>
												</div>
											</div>
										</div>
									</div>
								</CardContent>
							</Card>

							{/* Products */}
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<Package className="w-5 h-5" />
											Available Products ({result.totalResults || result.products?.length || 0})
										</div>
										{result.products && result.products.length > 0 && (
											<div className="flex items-center gap-2 text-sm text-gray-500">
												<CheckCircle className="w-4 h-4 text-green-600" />
												{result.products.length} products found
											</div>
										)}
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									{result.products?.map((product: any, index: number) => (
										<div
											key={index}
											className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-200 hover:border-green-300 hover:bg-green-50/30"
										>
											<div className="flex flex-col lg:flex-row gap-6">
												{/* Product Info */}
												<div className="flex-1">
													<div className="flex items-start justify-between mb-4">
														<div>
															<h3 className="text-xl font-bold text-gray-900 mb-2">
																{product.productName}
															</h3>
															<p className="text-gray-600 mb-3">
																{product.brand} {product.model}
															</p>
														</div>
														<div className="text-right">
															<div className="text-2xl font-bold text-green-600 mb-1">
																{product.price}
															</div>
															<div className="flex items-center gap-1 justify-end">
																{Array.from({ length: 5 }).map((_, i) => (
																	<Star
																		key={i}
																		className={`w-4 h-4 ${
																			i < parseInt(product.rating) 
																				? "text-yellow-400 fill-current" 
																				: "text-gray-300"
																		}`}
																	/>
																))}
																<span className="text-sm text-gray-500 ml-1">
																	({product.rating}/5)
																</span>
															</div>
														</div>
													</div>

													{/* Product Details Grid */}
													<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
														<div className="space-y-2">
															<div className="flex items-center gap-2">
																{getSellerIcon(product.sellerType)}
																<span className="text-sm text-gray-600">
																	{product.sellerName} ({product.sellerType})
																</span>
															</div>
															<div className="flex items-center gap-2">
																<CheckCircle className="w-4 h-4 text-gray-500" />
																<Badge className={getCertificationColor(product.certification)}>
																	{product.certification}
																</Badge>
															</div>
															<div className="flex items-center gap-2">
																<Phone className="w-4 h-4 text-gray-500" />
																<span className="text-sm text-gray-600">
																	{product.contactInfo}
																</span>
															</div>
														</div>
														<div className="space-y-2">
															<div className="flex items-center gap-2">
																<Truck className="w-4 h-4 text-gray-500" />
																<span className="text-sm text-gray-600">
																	{product.deliveryOptions}
																</span>
															</div>
															<div className="flex items-center gap-2">
																<Package className="w-4 h-4 text-gray-500" />
																<Badge className={getStockColor(product.stockAvailability)}>
																	{product.stockAvailability}
																</Badge>
															</div>
														</div>
													</div>


												</div>

												{/* Action Buttons */}
												<div className="flex flex-col gap-3 lg:w-48">
													<Button
														className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
														onClick={() => {
															toast({
																title: "Buy Now",
																description: `Redirecting to store location for ${product.productName}`,
															});
															// Simulate opening store location
															setTimeout(() => {
																window.open(`https://www.google.com/maps/search/?api=1&query=${product.sellerName}`, '_blank');
															}, 1000);
														}}
													>
														<CreditCard className="w-4 h-4 mr-2" />
														Buy Now
													</Button>
													<Button
														variant="outline"
														className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
														onClick={() => {
															toast({
																title: "Contact Seller",
																description: `Contact ${product.sellerName} via phone: ${product.contactInfo}`,
															});
															// Open phone dialer
															setTimeout(() => {
																window.open(`tel:${product.contactInfo}`, '_blank');
															}, 1000);
														}}
													>
														<Phone className="w-4 h-4 mr-2" />
														Contact Seller
													</Button>
													<Button
														variant="outline"
														className="w-full border-green-200 text-green-700 hover:bg-green-50"
														onClick={() => handleViewDetails(product)}
													>
														<FileText className="w-4 h-4 mr-2" />
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
													<Button 
														variant="outline" 
														size="sm"
														onClick={() => handleViewDetails(product)}
													>
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

					{/* Empty State */}
					{!result.overview && !isLoading && Object.keys(result).length > 0 && (
						<Card className="bg-gradient-to-r from-yellow-50 to-orange-50">
							<CardContent className="flex items-center justify-center py-12">
								<div className="text-center">
									<Package className="w-12 h-12 mx-auto mb-4 text-orange-600" />
									<h3 className="text-lg font-semibold text-gray-800 mb-2">No Products Found</h3>
									<p className="text-gray-600 mb-4">Try adjusting your search criteria or browse our quick search examples below.</p>
									<Button 
										variant="outline" 
										onClick={() => setResult({})}
										className="border-orange-200 text-orange-700 hover:bg-orange-50"
									>
										<Search className="w-4 h-4 mr-2" />
										New Search
									</Button>
								</div>
							</CardContent>
						</Card>
					)}

					{/* Quick Search Examples */}
					{!result.overview && !isLoading && (
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Search className="w-5 h-5" />
									Quick Search Examples
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
									<p className="text-sm text-gray-600 col-span-full mb-2">
										Click any example below to quickly search for popular products:
									</p>
									<Button
										variant="outline"
										disabled={isLoading}
										onClick={async () => {
											setProductType("tractor");
											setProductName("Mahindra");
											setLocation("Maharashtra");
											setBudget("");
											setRequirements("");
											
											// Trigger search automatically
											const input: MarketplaceSearchInput = {
												productType: "tractor",
												productName: "Mahindra",
												location: "Maharashtra",
												budget: "",
												requirements: "",
											};
											
											setIsLoading(true);
											try {
												const searchResult = await getMarketplaceSearch(input);
												setResult(searchResult);
												toast({
													title: "Search Complete",
													description: `Found ${searchResult.totalResults} products for Mahindra tractors in Maharashtra`,
												});
											} catch (error) {
												console.error('Search error:', error);
												toast({
													title: "Search Failed",
													description: "Failed to search for products. Please try again.",
													variant: "destructive",
												});
											} finally {
												setIsLoading(false);
											}
										}}
										className="h-auto p-4 flex flex-col items-start gap-2 hover:bg-green-50 hover:border-green-300 transition-all duration-200"
									>
										<div className="flex items-center gap-2 mb-1">
											<Truck className="w-4 h-4 text-green-600" />
											<span className="font-semibold text-green-700">Mahindra Tractors</span>
										</div>
										<span className="text-sm text-gray-600">In Maharashtra</span>
									</Button>
									<Button
										variant="outline"
										disabled={isLoading}
										onClick={async () => {
											setProductType("fertilizer");
											setProductName("Urea");
											setLocation("Punjab");
											setBudget("");
											setRequirements("");
											
											// Trigger search automatically
											const input: MarketplaceSearchInput = {
												productType: "fertilizer",
												productName: "Urea",
												location: "Punjab",
												budget: "",
												requirements: "",
											};
											
											setIsLoading(true);
											try {
												const searchResult = await getMarketplaceSearch(input);
												setResult(searchResult);
												toast({
													title: "Search Complete",
													description: `Found ${searchResult.totalResults} products for Urea fertilizers in Punjab`,
												});
											} catch (error) {
												console.error('Search error:', error);
												toast({
													title: "Search Failed",
													description: "Failed to search for products. Please try again.",
													variant: "destructive",
												});
											} finally {
												setIsLoading(false);
											}
										}}
										className="h-auto p-4 flex flex-col items-start gap-2 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
									>
										<div className="flex items-center gap-2 mb-1">
											<Package className="w-4 h-4 text-blue-600" />
											<span className="font-semibold text-blue-700">Urea Fertilizers</span>
										</div>
										<span className="text-sm text-gray-600">In Punjab</span>
									</Button>
									<Button
										variant="outline"
										disabled={isLoading}
										onClick={async () => {
											setProductType("seeds");
											setProductName("Pioneer");
											setLocation("Karnataka");
											setBudget("");
											setRequirements("");
											
											// Trigger search automatically
											const input: MarketplaceSearchInput = {
												productType: "seeds",
												productName: "Pioneer",
												location: "Karnataka",
												budget: "",
												requirements: "",
											};
											
											setIsLoading(true);
											try {
												const searchResult = await getMarketplaceSearch(input);
												setResult(searchResult);
												toast({
													title: "Search Complete",
													description: `Found ${searchResult.totalResults} products for Pioneer seeds in Karnataka`,
												});
											} catch (error) {
												console.error('Search error:', error);
												toast({
													title: "Search Failed",
													description: "Failed to search for products. Please try again.",
													variant: "destructive",
												});
											} finally {
												setIsLoading(false);
											}
										}}
										className="h-auto p-4 flex flex-col items-start gap-2"
									>
										<span className="font-semibold">Pioneer Seeds</span>
										<span className="text-sm text-gray-600">In Karnataka</span>
									</Button>
									<Button
										variant="outline"
										disabled={isLoading}
										onClick={async () => {
											setProductType("pesticides");
											setProductName("Bayer");
											setLocation("Tamil Nadu");
											setBudget("");
											setRequirements("");
											
											// Trigger search automatically
											const input: MarketplaceSearchInput = {
												productType: "pesticides",
												productName: "Bayer",
												location: "Tamil Nadu",
												budget: "",
												requirements: "",
											};
											
											setIsLoading(true);
											try {
												const searchResult = await getMarketplaceSearch(input);
												setResult(searchResult);
												toast({
													title: "Search Complete",
													description: `Found ${searchResult.totalResults} products for Bayer pesticides in Tamil Nadu`,
												});
											} catch (error) {
												console.error('Search error:', error);
												toast({
													title: "Search Failed",
													description: "Failed to search for products. Please try again.",
													variant: "destructive",
												});
											} finally {
												setIsLoading(false);
											}
										}}
										className="h-auto p-4 flex flex-col items-start gap-2"
									>
										<span className="font-semibold">Bayer Pesticides</span>
										<span className="text-sm text-gray-600">In Tamil Nadu</span>
									</Button>
									<Button
										variant="outline"
										disabled={isLoading}
										onClick={async () => {
											setProductType("tools");
											setProductName("John Deere");
											setLocation("Maharashtra");
											setBudget("");
											setRequirements("");
											
											// Trigger search automatically
											const input: MarketplaceSearchInput = {
												productType: "tools",
												productName: "John Deere",
												location: "Maharashtra",
												budget: "",
												requirements: "",
											};
											
											setIsLoading(true);
											try {
												const searchResult = await getMarketplaceSearch(input);
												setResult(searchResult);
												toast({
													title: "Search Complete",
													description: `Found ${searchResult.totalResults} products for John Deere tools in Maharashtra`,
												});
											} catch (error) {
												console.error('Search error:', error);
												toast({
													title: "Search Failed",
													description: "Failed to search for products. Please try again.",
													variant: "destructive",
												});
											} finally {
												setIsLoading(false);
											}
										}}
										className="h-auto p-4 flex flex-col items-start gap-2"
									>
										<span className="font-semibold">John Deere Tools</span>
										<span className="text-sm text-gray-600">In Maharashtra</span>
									</Button>
									<Button
										variant="outline"
										disabled={isLoading}
										onClick={async () => {
											setProductType("tractor");
											setProductName("Swaraj");
											setLocation("Punjab");
											setBudget("");
											setRequirements("");
											
											// Trigger search automatically
											const input: MarketplaceSearchInput = {
												productType: "tractor",
												productName: "Swaraj",
												location: "Punjab",
												budget: "",
												requirements: "",
											};
											
											setIsLoading(true);
											try {
												const searchResult = await getMarketplaceSearch(input);
												setResult(searchResult);
												toast({
													title: "Search Complete",
													description: `Found ${searchResult.totalResults} products for Swaraj tractors in Punjab`,
												});
											} catch (error) {
												console.error('Search error:', error);
												toast({
													title: "Search Failed",
													description: "Failed to search for products. Please try again.",
													variant: "destructive",
												});
											} finally {
												setIsLoading(false);
											}
										}}
										className="h-auto p-4 flex flex-col items-start gap-2"
									>
										<span className="font-semibold">Swaraj Tractors</span>
										<span className="text-sm text-gray-600">In Punjab</span>
									</Button>
								</div>
							</CardContent>
						</Card>
					)}
				</div>
			</div>

			{/* Product Details Dialog */}
			<ProductDetailsDialog />
		</AppLayout>
	);
} 