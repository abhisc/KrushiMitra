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
} from "lucide-react";
import { useState, useEffect } from "react";
import { storeRecentInput } from "@/utils/localStorage";
import { useAuth } from "@/contexts/auth-context";
import AdditionalInfoCard from "@/components/additional-info-card";
import AdditionalInfoForm from "@/components/additional-info-form";
import { useAdditionalInfo } from "@/hooks/use-additional-info";

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
		if (user && userProfile) {
			const hasAdditionalInfo = userProfile.age || userProfile.gender || userProfile.location?.city || 
									userProfile.isStudent || userProfile.minority || userProfile.disability || 
									userProfile.caste || userProfile.residence;
			
			if (!hasAdditionalInfo) {
				resetCard(); // Reset card state to show it
			}
		} else if (user) {
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
						<div className="w-16 h-16 bg-primary rounded-2xl mx-auto mb-4 flex items-center justify-center">
							<Bot className="w-8 h-8 text-primary-foreground" />
						</div>
						<h2 className="text-3xl font-bold text-foreground mb-2">
							AI-Powered Agricultural Assistant
						</h2>
						<p className="text-lg text-muted-foreground">
							Smart farming solutions for modern agriculture
						</p>
					</div>

					{/* Chat Interface */}
					<div className="bg-card rounded-2xl shadow-xl p-8 border border-border">
						<div className="flex items-center justify-center mb-6">
							<Bot className="w-8 h-8 text-primary mr-3" />
							<span className="text-2xl font-semibold text-primary">
								Talk to KrushiMitra
							</span>
						</div>

						<p className="text-muted-foreground text-center mb-6">
							Get instant answers, advice, and support for your farming needs.
						</p>

						<div className="max-w-2xl mx-auto">
							<textarea
								rows={3}
								value={userInput}
								onChange={(e) => setUserInput(e.target.value)}
								className="w-full bg-background text-foreground border-2 border-border rounded-xl px-6 py-4 text-base focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
								placeholder="Ask me anything about farming - crop diseases, market prices, weather, subsidies..."
							/>
							<div className="flex justify-between items-center mt-4">
								<button
									onClick={handleUserSend}
									disabled={loading || !userInput.trim()}
									className="disabled:opacity-45 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground px-8 py-3 rounded-xl font-semibold text-base transition-all duration-200 shadow-lg hover:shadow-xl flex items-center"
								>
									{loading ? (
										<>
											<div className="w-4 h-4 mr-2 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
											Thinking...
										</>
									) : (
										<>
											<Send className="w-4 h-4 mr-2" />
											Send
										</>
									)}
								</button>
								<button
									disabled={loading}
									className="disabled:opacity-45 flex items-center px-6 py-3 bg-muted hover:bg-accent text-primary rounded-xl font-medium transition-colors"
								>
									<Mic className="w-4 h-4 mr-2" />
									Speak
								</button>
							</div>
						</div>

						{/* AI Response Display */}
						{aiResponse.response && (
							<MarkdownComponent
								css={"m-6 pt-2 px-4"}
								text={aiResponse.response || ""}
							/>
						)}

						{/* Quick Prompts */}
						<div className="mt-8 pt-6 border-t border-border">
							<p className="text-sm font-medium text-muted-foreground mb-3 text-center">
								Quick prompts to get started:
							</p>
							<div className="flex flex-wrap justify-center gap-3">
								{quickPrompts.map((prompt, index) => (
									<button
										key={index}
										onClick={() => setUserInput(prompt)}
										className="text-sm text-primary hover:text-primary/80 hover:bg-primary/10 px-4 py-2 rounded-lg border border-primary/20 transition-colors"
									>
										{prompt}
									</button>
								))}
							</div>
						</div>
					</div>

					{/* Crop Management Tools */}
					<div className="mb-8">
						<h3 className="text-2xl font-bold text-foreground mb-6 text-center text-primary">
							Crop Management
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
							{/* Farm Journal Entry Point */}
							<a href="/journal" className="bg-card border border-primary/30 rounded-xl p-6 text-left hover:shadow-lg transition-all duration-200 hover:border-primary flex flex-col">
								<BookOpen className="w-8 h-8 text-primary mb-4" />
								<h4 className="text-lg font-semibold text-foreground mb-2">My Farm Journal</h4>
								<p className="text-sm text-muted-foreground">Log daily activities, track inputs, and view your farm's history and insights.</p>
							</a>
							{/* Existing tools */}
							{[
								{
									icon: Activity,
									title: "Crop Growth Process Advisor",
									subtitle:
										"Track crop lifecycle and get intelligent farming suggestions",
								},
								{
									icon: Activity,
									title: "Instant Crop Disease Diagnosis",
									subtitle: "Detect diseases from crop images using AI",
								},
							].map((tool, index) => (
								<button
									key={index}
									className="bg-card border border-border rounded-xl p-6 text-left hover:shadow-lg transition-all duration-200 hover:border-primary/30"
								>
									<tool.icon className="w-8 h-8 text-primary mb-4" />
									<h4 className="text-lg font-semibold text-foreground mb-2">
										{tool.title}
									</h4>
									<p className="text-sm text-muted-foreground">{tool.subtitle}</p>
								</button>
							))}
						</div>
					</div>

					{/* Marketplace & Finance Tools */}
					<div>
						<h3 className="text-2xl font-bold text-foreground mb-6 text-center text-primary">
							Marketplace & Financial Services
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							{[
								{
									icon: TrendingUp,
									title: "Profitability Calculator & Finance Manager",
									subtitle:
										"Analyze costs and profits for your farm operations",
								},
								{
									icon: TrendingUp,
									title: "Farming Marketplace",
									subtitle:
										"Buy and sell farming products from verified vendors",
								},
								{
									icon: TrendingUp,
									title: "Community Commerce (P2P Trading)",
									subtitle: "Trade tools and produce with nearby farmers",
								},
								{
									icon: TrendingUp,
									title: "Real-Time Market Insights",
									subtitle: "Get live market prices and future price forecasts",
								},
							].map((tool, index) => (
								<button
									key={index}
									className="bg-card border border-border rounded-xl p-6 text-left hover:shadow-lg transition-all duration-200 hover:border-primary/30"
								>
									<tool.icon className="w-8 h-8 text-primary mb-4" />
									<h4 className="text-lg font-semibold text-foreground mb-2">
										{tool.title}
									</h4>
									<p className="text-sm text-muted-foreground">{tool.subtitle}</p>
								</button>
							))}
						</div>
					</div>
				</div>
			</div>

			{/* Additional Info Card - Floating in bottom right */}
			{user && showAdditionalInfoCard && (
				<div className="fixed bottom-6 right-6 z-50">
					<AdditionalInfoCard
						onFillNow={handleFillAdditionalInfo}
						onDismiss={handleDismissAdditionalInfo}
					/>
				</div>
			)}
		</AppLayout>
	);
}
