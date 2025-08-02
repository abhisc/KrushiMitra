"use client";

import { Loader2, Sprout, Trash } from "lucide-react";
import { useEffect, useState } from "react";
import type { PlantationFlowData } from "@/ai/flows/plantation-flow";
import { GetPlantationFlow } from "@/ai/flows/plantation-flow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
	CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";

export function AiPlantationAdvisor({
	onSavePlan,
}: {
	onSavePlan?: (plan: PlantationFlowData) => void;
}) {
	const { toast } = useToast();
	const { user, userProfile, loadUserProfile } = useAuth();
	const [isLoading, setIsLoading] = useState(false);
	const [aiResponse, setAiResponse] = useState<PlantationFlowData | null>(null);

	console.log("User Profile:", userProfile);

	// Form state
	const [state, setState] = useState(userProfile?.location?.state || "");
	const [market, setMarket] = useState(userProfile?.location?.city || "");
	const [cropInput, setCropInput] = useState("");
	const [crops, setCrops] = useState<string[]>([]);
	const [moreDetails, setMoreDetails] = useState("");

	useEffect(() => {
		// Load user profile if not already loaded
		if (!userProfile) {
			loadUserProfile();
		}
		setState(userProfile?.location?.state || "");
		setMarket(userProfile?.location?.city || "");
	}, [user, userProfile, loadUserProfile]);

	// Add crop to the list
	const addCrop = () => {
		if (cropInput.trim() === "") return;

		setCrops((prev) => [...prev, cropInput.trim()]);
		setCropInput("");
	};

	// Remove crop from list
	const removeCrop = (index: number) => {
		setCrops((prev) => prev.filter((_, i) => i !== index));
	};

	// Handle form submission
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!state || !market) {
			toast({
				title: "Missing information",
				description: "Please provide both state and market/district",
				variant: "destructive",
			});
			return;
		}

		setIsLoading(true);
		setAiResponse(null);

		try {
			// Call the AI flow with form data
			const response = await GetPlantationFlow({
				state,
				market,
				crops: crops.length > 0 ? crops : undefined,
				moreDetails: moreDetails || undefined,
			});

			setAiResponse(response);

			toast({
				title: "AI Plan Generated",
				description: "Successfully generated plantation recommendations",
			});
		} catch (error) {
			console.error("Error generating AI plan:", error);
			toast({
				title: "Error",
				description: "Failed to generate AI plantation plan. Please try again.",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	// Format date for display
	const formatDate = (date: Date) => {
		return new Date(date).toLocaleDateString();
	};

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Sprout className="h-5 w-5 text-green-600" />
						AI Plantation Advisor
					</CardTitle>
					<CardDescription>
						Get AI-powered recommendations for your plantation based on your
						location and preferences
					</CardDescription>
				</CardHeader>

				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="state">State *</Label>
								<Input
									id="state"
									value={state}
									onChange={(e) => setState(e.target.value)}
									placeholder="Enter your state"
									required
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="market">Market/District *</Label>
								<Input
									id="market"
									value={market}
									onChange={(e) => setMarket(e.target.value)}
									placeholder="Enter your market or district"
									required
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="crops">Crops of Interest</Label>
							<div className="flex gap-2">
								<Input
									id="crops"
									value={cropInput}
									onChange={(e) => setCropInput(e.target.value)}
									placeholder="Add a crop"
								/>
								<Button type="button" onClick={addCrop} variant="outline">
									Add
								</Button>
							</div>

							{crops.length > 0 && (
								<div className="flex flex-wrap gap-2 mt-2">
									{crops.map((crop, index) => (
										<Badge
											key={index}
											variant="secondary"
											className="flex items-center gap-1"
										>
											{crop}
											<button
												type="button"
												onClick={() => removeCrop(index)}
												className="ml-1 rounded-full hover:bg-muted p-0.5"
											>
												<Trash className="h-3 w-3" />
											</button>
										</Badge>
									))}
								</div>
							)}
							<p className="text-xs text-muted-foreground">
								Add crops you're interested in planting. If none specified, AI
								will recommend suitable crops.
							</p>
						</div>

						<div className="space-y-2">
							<Label htmlFor="moreDetails">Additional Details</Label>
							<Textarea
								id="moreDetails"
								value={moreDetails}
								onChange={(e) => setMoreDetails(e.target.value)}
								placeholder="Enter any specific requirements, soil conditions, or other relevant information"
								rows={3}
							/>
						</div>

						<Button
							type="submit"
							disabled={isLoading || !state || !market}
							className="w-full"
						>
							{isLoading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Generating Recommendations...
								</>
							) : (
								"Generate AI Plantation Plan"
							)}
						</Button>
					</form>
				</CardContent>
			</Card>

			{aiResponse && (
				<Card>
					<CardHeader>
						<CardTitle>AI Plantation Recommendations</CardTitle>
						<CardDescription>
							Customized plantation plan for {state}, {market}
						</CardDescription>
					</CardHeader>

					<CardContent className="space-y-4">
						<div className="space-y-2">
							<h3 className="font-medium text-lg">{aiResponse.name}</h3>
							<p className="text-sm text-muted-foreground">
								{aiResponse.description}
							</p>
							<div className="text-sm">
								<span className="font-medium">Timeline:</span>{" "}
								{formatDate(aiResponse.startDate)} to{" "}
								{formatDate(aiResponse.endDate)}
							</div>
						</div>

						<div className="space-y-3">
							<h4 className="font-medium">Recommended Crops</h4>
							{aiResponse.crops.map((crop, index) => (
								<Card key={index} className="border-2">
									<CardHeader className="py-3">
										<CardTitle className="text-base">{crop.name}</CardTitle>
									</CardHeader>
									<CardContent className="py-2 space-y-2">
										<p className="text-sm">{crop.description}</p>
										<div className="text-xs text-muted-foreground">
											<div>Plant: {formatDate(crop.startDate)}</div>
											<div>Harvest: {formatDate(crop.endDate)}</div>
											{crop.area && (
												<div>Area: {crop.area} acres/hectares</div>
											)}
											{crop.expectedIncome && (
												<div>Expected Income: ₹{parseFloat(crop.expectedIncome).toLocaleString('en-IN')}</div>
											)}
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					</CardContent>

					{onSavePlan && (
						<CardFooter>
							<Button className="w-full" onClick={() => onSavePlan(aiResponse)}>
								Save This Plan
							</Button>
						</CardFooter>
					)}
				</Card>
			)}
		</div>
	);
}
