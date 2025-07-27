"use client";

import { AskAnything } from "@/ai/flows/ask-anything";
import { MarkdownComponent } from "@/components/ui/markdown";
import { ChatBox } from "@/components/ui/chatbox";
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
import { useRouter } from "next/navigation";
import AppLayout from "@/components/agrimitra/app-layout";

export default function Home() {
	const quickPrompts = [
		"Check price of tomato",
		"My wheat crop looks yellow",
		"Show fertilizer subsidies",
		"Weather forecast for crops",
		"Pest control for rice",
	];

	const Router = useRouter();

	// For the original implementation
	const [userInput, setUserInput] = useState("");
	const [aiResponse, setAiResponse] = useState<{
		response?: string;
		moveToOtherPage?: { confirmed?: boolean; page?: string };
	}>({});

	// For both implementations
	const [loading, setLoading] = useState(false);
	const { toast } = useToast();
	const { user, userProfile, loadUserProfile } = useAuth();

	// For the ChatBox component implementation
	const [messages, setMessages] = useState<
		{ role: "user" | "model"; content: [{ text: string }]; timestamp?: Date }[]
	>([]);

	const [showAdditionalInfoForm, setShowAdditionalInfoForm] = useState(false);
	const {
		showCard: showAdditionalInfoCard,
		dismissCard: dismissAdditionalInfoCard,
		resetCard,
	} = useAdditionalInfo();

	useEffect(() => {
		// Check if user has additional info and show card if needed
		if (user && userProfile) {
			const hasAdditionalInfo =
				userProfile.age ||
				userProfile.gender ||
				userProfile.location?.city ||
				userProfile.isStudent ||
				userProfile.minority ||
				userProfile.disability ||
				userProfile.caste ||
				userProfile.residence;

			if (!hasAdditionalInfo) {
				resetCard(); // Reset card state to show it
			}
		} else if (user) {
			resetCard(); // Reset card state to show it
		}
	}, [user, userProfile, resetCard]);

	// For the original implementation
	const handleUserSend = async () => {
		if (!userInput.trim()) return;

		// Store the user input in localStorage
		storeRecentInput(userInput.trim());

		setLoading(true);
		try {
			const newMessages = [
				...messages,
				{
					role: "user",
					content: [{ text: userInput.trim() }] as [{ text: string }],
				},
			];
			setMessages(newMessages);
			const resp = await AskAnything({
				text: userInput.trim(),
				messages: newMessages,
			});
			console.log(resp);
			setUserInput("");
			if (resp?.moveToOtherPage?.confirmed) {
				setMessages([]);
				Router.push(resp.moveToOtherPage.page);
			}
			setMessages((prev) => [
				...prev,
				{
					role: "model",
					content: [{ text: resp.response?.substring(0, 100) }],
				},
			]);
			setAiResponse(resp);
		} catch (error) {
			console.error("Error getting AI response:", error);
			setMessages([]);
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

	// For the ChatBox component implementation
	const handleSendMessage = async (userInput: string) => {
		// Store the user input in localStorage
		storeRecentInput(userInput);

		setLoading(true);
		try {
			const newUserMessage = {
				role: "user" as const,
				content: [{ text: userInput }] as [{ text: string }],
				timestamp: new Date(),
			};

			const newMessages = [...messages, newUserMessage];
			setMessages(newMessages);

			const resp = await AskAnything({
				text: userInput,
				messages: newMessages,
			});

			console.log(resp);

			if (resp?.moveToOtherPage?.confirmed) {
				setMessages([]);
				Router.push(resp.moveToOtherPage.page);
				return;
			}

			const aiMessage = {
				role: "model" as const,
				content: [
					{ text: resp.response || "Sorry, I couldn't process your request." },
				] as [{ text: string }],
				timestamp: new Date(),
			};

			setMessages((prev) => [...prev, aiMessage]);
		} catch (error) {
			console.error("Error getting AI response:", error);
			const errorMessage = {
				role: "model" as const,
				content: [
					{ text: "Sorry, I encountered an error. Please try again." },
				] as [{ text: string }],
				timestamp: new Date(),
			};
			setMessages((prev) => [...prev, errorMessage]);

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

	// Clear chat handler
	const handleClearChat = () => {
		setMessages([]);
		toast({
			title: "Chat cleared",
			description: "All messages have been removed.",
		});
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
			<div className="p-4 h-full flex justify-center">
				<div className="max-w-4xl flex-1 flex flex-col gap-4">
					{/* Additional Info Form Modal */}
					{showAdditionalInfoForm && (
						<AdditionalInfoForm
							onClose={() => setShowAdditionalInfoForm(false)}
							onSuccess={handleAdditionalInfoSuccess}
						/>
					)}

					{/* Welcome Section - More compact */}
					<div className="flex justify-center flex-shrink-0">
						<div className="w-10 h-10 bg-primary rounded-lg mr-2 flex items-center justify-center">
							<Bot className="w-5 h-5 text-primary-foreground" />
						</div>
						<div className="flex flex-col items-center">
							<h2 className="text-xl font-bold text-foreground">
								AI-Powered Agricultural Assistant
							</h2>
							<p className="text-sm text-muted-foreground">
								Smart farming solutions for modern agriculture
							</p>
						</div>
					</div>

					{/* ChatBox Component - takes remaining height */}
					<div className="flex-1 min-h-0 pb-4">
						<ChatBox
							onSendMessage={handleSendMessage}
							onClearChat={handleClearChat}
							loading={loading}
							messages={messages}
							className="h-full"
						/>
					</div>

					{/* Original Chat Interface (hidden for now, can be toggled if needed) */}
					<div className="hidden bg-card rounded-2xl shadow-xl p-8 border border-border">
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
