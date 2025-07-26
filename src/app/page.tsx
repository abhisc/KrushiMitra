"use client";

import { AskAnything } from "@/ai/flows/ask-anything";
import AppLayout from "@/components/agrimitra/app-layout";
import { MarkdownComponent } from "@/components/ui/markdown";
import { useToast } from "@/hooks/use-toast";
import {
	Activity,
	TrendingUp,
	FileText,
	Cloud,
	Bot,
	Send,
	Mic,
	BookOpen,
	Loader2,
	Stethoscope,
	Calculator,
	ShoppingCart,
	Users,
} from "lucide-react";
import { useState, useEffect } from "react";
import { storeRecentInput } from "@/utils/localStorage";
import { useAuth } from "@/contexts/auth-context";
import AdditionalInfoCard from "@/components/additional-info-card";
import AdditionalInfoForm from "@/components/additional-info-form";
import { useAdditionalInfo } from "@/hooks/use-additional-info";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";


export default function Home() {
	const quickPrompts = [
		"Check price of tomato",
		"My wheat crop looks yellow",
		"Show fertilizer subsidies",
		"Weather forecast for crops",
		"Pest control for rice",
	];

	const [userInput, setUserInput] = useState("");
	const [aiResponse, setAiResponse] = useState<{ response?: string }>({});
	const [loading, setLoading] = useState(false);
	const { toast } = useToast();
	const { user, userProfile, loadUserProfile } = useAuth();
	const [showAdditionalInfoForm, setShowAdditionalInfoForm] = useState(false);
	const { showCard: showAdditionalInfoCard, dismissCard: dismissAdditionalInfoCard, resetCard } = useAdditionalInfo();

	useEffect(() => {
		// Check if user has additional info and show card if needed
		// Only show if user hasn't explicitly dismissed it
		const isDismissed = localStorage.getItem('additional-info-dismissed');
		
		if (user && userProfile && !isDismissed) {
			const hasAdditionalInfo = userProfile.age || userProfile.gender || userProfile.location?.city || 
									userProfile.isStudent || userProfile.minority || userProfile.disability || 
									userProfile.caste || userProfile.residence;
			
			if (!hasAdditionalInfo) {
				resetCard(); // Reset card state to show it
			}
		} else if (user && !isDismissed) {
			resetCard(); // Reset card state to show it
		}
	}, [user, userProfile, resetCard]);

	const handleUserSend = async () => {
		if (!userInput.trim()) return;

		// Store the user input in localStorage
		storeRecentInput(userInput.trim());

		setLoading(true);
		try {
			const resp = await AskAnything({ text: userInput.trim() });
			setAiResponse(resp);
		} catch (error) {
			console.error("Error getting AI response:", error);
			setAiResponse({
				response: "Sorry, I encountered an error. Please try again.",
			});
			toast({
				title: "Error",
				description:
					"Failed to get response from KrushiMitra. Please try again.",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	const handleFillAdditionalInfo = () => {
		setShowAdditionalInfoForm(true);
		dismissAdditionalInfoCard();
	};

	const handleDismissAdditionalInfo = () => {
		console.log('handleDismissAdditionalInfo called');
		dismissAdditionalInfoCard();
	};

	const handleAdditionalInfoSuccess = async () => {
		setShowAdditionalInfoForm(false);
		await loadUserProfile();
		toast({
			title: "Success",
			description: "Additional information saved successfully!",
		});
	};

	return (
		<AppLayout
			handleHistoryChatClick={(text) => setUserInput(text)}
			title="KrushiMitra"
			subtitle="AI-Powered Agricultural Assistant"
		>
			<div className="p-6">
				<div className="max-w-4xl mx-auto space-y-8">
					{/* Additional Info Form Modal */}
					{showAdditionalInfoForm && (
						<AdditionalInfoForm
							onClose={() => setShowAdditionalInfoForm(false)}
							onSuccess={handleAdditionalInfoSuccess}
						/>
					)}

					{/* Welcome Section */}
					<div className="text-center mb-8">
						<h1 className="text-4xl font-bold text-primary mb-4">
							AI-Powered Agricultural Assistant
						</h1>
						<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
							Smart farming solutions for modern agriculture
						</p>
					</div>

					{/* Chat Interface */}
					<div className="bg-card rounded-lg border border-border p-6">
						<div className="mb-6">
							<h2 className="text-2xl font-semibold text-foreground mb-2">
								Talk to KrushiMitra
							</h2>
							<p className="text-muted-foreground">
								Get instant answers, advice, and support for your farming needs.
							</p>
						</div>

						{/* Chat Messages */}
						<div className="space-y-4 mb-6 min-h-[200px] max-h-[400px] overflow-y-auto">
							{loading && (
								<div className="flex items-center space-x-2 text-muted-foreground">
									<Loader2 className="w-4 h-4 animate-spin" />
									<span>Thinking...</span>
								</div>
							)}
							{aiResponse.response && (
								<div className="bg-muted rounded-lg p-4">
									<p className="text-foreground">{aiResponse.response}</p>
								</div>
							)}
						</div>

						{/* Input Area */}
						<div className="flex space-x-2">
							<Input
								value={userInput}
								onChange={(e) => setUserInput(e.target.value)}
								placeholder="Ask anything about farming..."
								onKeyPress={(e) => e.key === "Enter" && handleUserSend()}
								className="flex-1"
							/>
							<Button onClick={handleUserSend} disabled={loading || !userInput.trim()}>
								{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send"}
							</Button>
							<Button variant="outline" onClick={() => {}}>
								<Mic className="w-4 h-4" />
							</Button>
						</div>

						{/* Quick Prompts */}
						<div className="mt-6">
							<p className="text-sm text-muted-foreground mb-3">
								Quick prompts to get started:
							</p>
							<div className="flex flex-wrap gap-2">
								{quickPrompts.map((prompt, index) => (
									<Button
										key={index}
										variant="outline"
										size="sm"
										onClick={() => setUserInput(prompt)}
										className="text-xs"
									>
										{prompt}
									</Button>
								))}
							</div>
						</div>
					</div>

					{/* Features Grid */}
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{/* Crop Management */}
						<div className="space-y-4">
							<h3 className="text-xl font-semibold text-foreground">
								Crop Management
							</h3>
							<div className="space-y-4">
								<div className="bg-card rounded-lg border border-border p-4">
									<h4 className="text-lg font-semibold text-foreground mb-2">My Farm Journal</h4>
									<p className="text-sm text-muted-foreground">Log daily activities, track inputs, and view your farm's history and insights.</p>
								</div>
								<div className="bg-card rounded-lg border border-border p-4">
									<div className="flex items-start space-x-3">
										<div className="flex-shrink-0">
											<Activity className="w-6 h-6 text-primary" />
										</div>
										<div>
											<h5 className="font-semibold text-foreground">Crop Growth Process Advisor</h5>
											<p className="text-sm text-muted-foreground">Track crop lifecycle and get intelligent farming suggestions</p>
										</div>
									</div>
								</div>
								<div className="bg-card rounded-lg border border-border p-4">
									<div className="flex items-start space-x-3">
										<div className="flex-shrink-0">
											<Stethoscope className="w-6 h-6 text-primary" />
										</div>
										<div>
											<h5 className="font-semibold text-foreground">Instant Crop Disease Diagnosis</h5>
											<p className="text-sm text-muted-foreground">Detect diseases from crop images using AI</p>
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* Marketplace & Financial Services */}
						<div className="space-y-4">
							<h3 className="text-xl font-semibold text-foreground">
								Marketplace & Financial Services
							</h3>
							<div className="space-y-4">
								<div className="bg-card rounded-lg border border-border p-4">
									<div className="flex items-start space-x-3">
										<div className="flex-shrink-0">
											<Calculator className="w-6 h-6 text-primary" />
										</div>
										<div>
											<h5 className="font-semibold text-foreground">Profitability Calculator & Finance Manager</h5>
											<p className="text-sm text-muted-foreground">Analyze costs and profits for your farm operations</p>
										</div>
									</div>
								</div>
								<div className="bg-card rounded-lg border border-border p-4">
									<div className="flex items-start space-x-3">
										<div className="flex-shrink-0">
											<ShoppingCart className="w-6 h-6 text-primary" />
										</div>
										<div>
											<h5 className="font-semibold text-foreground">Farming Marketplace</h5>
											<p className="text-sm text-muted-foreground">Buy and sell farming products from verified vendors</p>
										</div>
									</div>
								</div>
								<div className="bg-card rounded-lg border border-border p-4">
									<div className="flex items-start space-x-3">
										<div className="flex-shrink-0">
											<Users className="w-6 h-6 text-primary" />
										</div>
										<div>
											<h5 className="font-semibold text-foreground">Community Commerce (P2P Trading)</h5>
											<p className="text-sm text-muted-foreground">Trade tools and produce with nearby farmers</p>
										</div>
									</div>
								</div>
								<div className="bg-card rounded-lg border border-border p-4">
									<div className="flex items-start space-x-3">
										<div className="flex-shrink-0">
											<TrendingUp className="w-6 h-6 text-primary" />
										</div>
										<div>
											<h5 className="font-semibold text-foreground">Real-Time Market Insights</h5>
											<p className="text-sm text-muted-foreground">Get live market prices and future price forecasts</p>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Additional Info Card - Floating in bottom right */}
			{user && showAdditionalInfoCard && (
				<div className="fixed bottom-6 right-6 z-[60] pointer-events-none">
					<div className="pointer-events-auto">
						<AdditionalInfoCard
							onFillNow={handleFillAdditionalInfo}
							onDismiss={handleDismissAdditionalInfo}
						/>
					</div>
				</div>
			)}
		</AppLayout>
	);
}
